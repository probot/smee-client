import validator from "validator";
import { fetch as undiciFetch, EnvHttpProxyAgent } from "undici";
import {
  EventSource,
  type FetchLike,
  type EventSourceFetchInit,
  type ErrorEvent,
} from "eventsource";
import url from "node:url";
import querystring from "node:querystring";

type Severity = "info" | "error";

interface Options {
  source: string;
  target: string;
  logger?: Pick<Console, Severity>;
  queryForwarding?: boolean;
  fetch?: any;
}

const proxyAgent = new EnvHttpProxyAgent();

class Client {
  #source: string;
  #target: string;
  #fetch: typeof undiciFetch;
  #logger: Pick<Console, Severity>;
  #events?: EventSource;
  #queryForwarding: boolean = true;

  constructor({
    source,
    target,
    logger = console,
    fetch = undiciFetch,
    queryForwarding = true,
  }: Options) {
    this.#source = source;
    this.#target = target;
    this.#logger = logger!;
    this.#fetch = fetch;
    this.#queryForwarding = queryForwarding;

    if (
      !validator.isURL(this.#source, {
        require_tld: false,
      })
    ) {
      throw new Error("The provided URL is invalid.");
    }
  }

  static async createChannel({ fetch = undiciFetch } = {}) {
    const response = await fetch("https://smee.io/new", {
      method: "HEAD",
      redirect: "manual",
      dispatcher: proxyAgent,
    });
    const address = response.headers.get("location");
    if (!address) {
      throw new Error("Failed to create channel");
    }
    return address;
  }

  async onmessage(msg: MessageEvent) {
    const data = JSON.parse(msg.data);

    const target = url.parse(this.#target, true);

    if (this.#queryForwarding) {
      const mergedQuery = { ...target.query, ...data.query };
      target.search = querystring.stringify(mergedQuery);
    }

    delete data.query;

    const body = JSON.stringify(data.body);
    delete data.body;

    const headers: { [key: string]: any } = {};

    Object.keys(data).forEach((key) => {
      headers[key] = data[key];
    });

    // Don't forward the host header. As it causes issues with some servers
    // See https://github.com/probot/smee-client/issues/295
    // See https://github.com/probot/smee-client/issues/187
    delete headers["host"];
    headers["content-length"] = Buffer.byteLength(body);
    headers["content-type"] = "application/json";

    try {
      const response = await this.#fetch(url.format(target), {
        method: "POST",
        mode: data["sec-fetch-mode"],
        body,
        headers,
        dispatcher: proxyAgent,
      });
      this.#logger.info(`POST ${response.url} - ${response.status}`);
    } catch (err) {
      this.#logger.error(err);
    }
  }

  onopen() {
    // This method is not used in this implementation, but can be overridden if needed.
  }

  onerror(err: ErrorEvent) {
    this.#logger.error(err);
  }

  async start(): Promise<EventSource> {
    const customFetch: FetchLike = (
      url: string | URL,
      options?: EventSourceFetchInit,
    ) => {
      return this.#fetch(url, {
        ...options,
        dispatcher: proxyAgent,
      });
    };

    const events = new EventSource(this.#source, {
      fetch: customFetch,
    });

    // Reconnect immediately
    (events as any).reconnectInterval = 0; // This isn't a valid property of EventSource

    events.addEventListener("message", this.onmessage.bind(this));
    events.addEventListener("open", this.onopen.bind(this));
    events.addEventListener("error", this.onerror.bind(this));

    const connected = new Promise<void>((resolve, reject) => {
      events.addEventListener("open", () => {
        this.#logger.info(`Connected to ${this.#source}`);
        events.removeEventListener("error", reject);
        resolve();
      });
      events.addEventListener("error", (err: ErrorEvent) => {
        if (events.readyState === EventSource.CLOSED) {
          this.#logger.error("Connection closed");
        } else {
          this.#logger.error("Error in connection", err);
        }
        reject(err);
      });
    });

    this.#logger.info(`Forwarding ${this.#source} to ${this.#target}`);
    this.#events = events;

    await connected;

    return events;
  }

  async stop() {
    if (this.#events) {
      this.#events.close();
      this.#events = null as any;
      this.#logger.info("Connection closed");
    }
  }
}

export default Client;
