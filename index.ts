import validator from "validator";
import { fetch as undiciFetch, EnvHttpProxyAgent } from "undici";
import {
  EventSource,
  type FetchLike,
  type FetchLikeInit,
  type ErrorEvent,
} from "eventsource";
import url from "node:url";
import querystring from "node:querystring";

type Severity = "info" | "error";

interface Options {
  source: string;
  target: string;
  logger?: Pick<Console, Severity>;
  fetch?: any;
}

const proxyAgent = new EnvHttpProxyAgent();

class Client {
  #source: string;
  #target: string;
  #fetch: typeof undiciFetch;
  #logger: Pick<Console, Severity>;
  #events!: EventSource;

  constructor({
    source,
    target,
    logger = console,
    fetch = undiciFetch,
  }: Options) {
    this.#source = source;
    this.#target = target;
    this.#logger = logger!;
    this.#fetch = fetch;

    if (!validator.isURL(this.#source)) {
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
    const mergedQuery = { ...target.query, ...data.query };
    target.search = querystring.stringify(mergedQuery);

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
    headers["expect"] = "";
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
    this.#logger.info("Connected", this.#events.url);
  }

  onerror(err: ErrorEvent) {
    this.#logger.error(err);
  }

  start() {
    const customFetch: FetchLike = (
      url: string | URL,
      options?: FetchLikeInit,
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

    this.#logger.info(`Forwarding ${this.#source} to ${this.#target}`);
    this.#events = events;

    return events;
  }
}

export default Client;
