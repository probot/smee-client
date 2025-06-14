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

class SmeeClient {
  #source: string;
  #target: string;
  #fetch: typeof undiciFetch;
  #logger: Pick<Console, Severity>;
  #events: EventSource | null = null;
  #queryForwarding: boolean = true;

  #onerror: (err: ErrorEvent) => void = (err) => {
    this.#logger.error("Error in connection", err);
  };

  #onopen: () => void = () => {};

  #onmessage: (msg: MessageEvent) => Promise<void> = async (msg) => {
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
  };

  #events_onopen: ((ev: Event) => void) | null = null;
  #events_onmessage: ((msg: MessageEvent) => void) | null = null;
  #events_onerror: ((ev: ErrorEvent) => void) | null = null;

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

  static async createChannel({
    fetch = undiciFetch,
    newChannelUrl = "https://smee.io/new",
  } = {}): Promise<string> {
    const response = await fetch(newChannelUrl, {
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

  get onmessage() {
    if (this.#events === null) {
      return this.#events_onmessage;
    }
    return this.#events.onmessage;
  }

  set onmessage(fn: ((msg: MessageEvent) => void) | null) {
    if (typeof fn !== "function" && fn !== null) {
      throw new TypeError("onmessage must be a function or null");
    }
    if (this.#events === null) {
      this.#events_onmessage = fn;
      return;
    }
    this.#events.onmessage = fn;
  }

  get onerror() {
    if (this.#events === null) {
      return this.#events_onerror;
    }
    return this.#events.onerror;
  }

  set onerror(fn: ((ev: ErrorEvent) => void) | null) {
    if (typeof fn !== "function" && fn !== null) {
      throw new TypeError("onerror must be a function or null");
    }
    if (this.#events === null) {
      this.#events_onerror = fn;
      return;
    }

    this.#events.onerror = fn;
  }

  get onopen() {
    if (this.#events === null) {
      return this.#events_onopen;
    }
    return this.#events.onopen;
  }

  set onopen(fn: ((ev: Event) => void) | null) {
    if (typeof fn !== "function" && fn !== null) {
      throw new TypeError("onopen must be a function or null");
    }
    if (this.#events === null) {
      this.#events_onopen = fn;
      return;
    }
    this.#events.onopen = fn;
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

    const connected = new Promise<void>((resolve, reject) => {
      const onError = (err: ErrorEvent) => {
        if (events.readyState === EventSource.CLOSED) {
          this.#logger.error("Connection closed");
        } else {
          this.#logger.error("Error in connection", err);
        }
        reject(err);
      };

      events.addEventListener("open", () => {
        this.#logger.info(`Connected to ${this.#source}`);
        events.removeEventListener("error", onError);
        resolve();
      });
      events.addEventListener("error", onError);
    });

    this.#events = events;

    events.addEventListener("message", this.#onmessage.bind(this));
    events.addEventListener("open", this.#onopen.bind(this));
    events.addEventListener("error", this.#onerror.bind(this));

    if (this.#events_onmessage) {
      events.onmessage = this.#events_onmessage;
    }
    if (this.#events_onopen) {
      events.onopen = this.#events_onopen;
    }
    if (this.#events_onerror) {
      events.onerror = this.#events_onerror;
    }

    this.#logger.info(`Forwarding ${this.#source} to ${this.#target}`);

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

export {
  SmeeClient as default,
  SmeeClient as "module.exports", // For require(esm) compatibility
  SmeeClient,
};
