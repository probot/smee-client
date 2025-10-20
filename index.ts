import { fetch as undiciFetch, EnvHttpProxyAgent } from "undici";
import {
  EventSource,
  type FetchLike,
  type EventSourceFetchInit,
  type ErrorEvent,
} from "eventsource";

type Severity = "info" | "error";

interface Options {
  source: string;
  target: string;
  logger?: Pick<Console, Severity>;
  queryForwarding?: boolean;
  fetch?: any;
  maxConnectionTimeout?: number;
  forward?: boolean;
}

const proxyAgent = new EnvHttpProxyAgent();

const trimTrailingSlash = (url: string): string => {
  return url.lastIndexOf("/") === url.length - 1 ? url.slice(0, -1) : url;
};

function validateURL(urlString: string): asserts urlString is string {
  if (URL.canParse(urlString) === false) {
    throw new Error(`The provided URL is invalid.`);
  }

  const url = new URL(urlString);

  if (!url.protocol || !["http:", "https:"].includes(url.protocol)) {
    throw new Error(`The provided URL is invalid.`);
  }

  if (!url.host) {
    throw new Error(`The provided URL is invalid.`);
  }
}

class SmeeClient {
  #source: string;
  #target: string;
  #fetch: typeof undiciFetch;
  #logger: Pick<Console, Severity>;
  #events: EventSource | null = null;
  #queryForwarding: boolean = true;
  #maxConnectionTimeout: number | undefined;
  #forward: boolean | undefined = undefined;

  #onerror: (err: ErrorEvent) => void = (err) => {
    if (this.#events?.readyState === EventSource.CLOSED) {
      this.#logger.error("Connection closed");
    } else {
      this.#logger.error("Error in connection", err);
    }
  };

  #onopen: () => void = () => {};

  #onmessage: (msg: MessageEvent) => Promise<void> = async (msg) => {
    if (!this.#forward) {
      return;
    }

    const data = JSON.parse(msg.data);

    const target = new URL(this.#target);

    if (this.#queryForwarding && data.query) {
      Object.keys(data.query).forEach((key) => {
        target.searchParams.set(key, data.query[key]);
      });
      target.search = target.searchParams.toString();
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
      const response = await this.#fetch(target, {
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
    maxConnectionTimeout,
    queryForwarding = true,
    forward,
  }: Options) {
    validateURL(target);
    validateURL(source);

    this.#source = trimTrailingSlash(new URL(source).toString());
    this.#target = trimTrailingSlash(new URL(target).toString());
    this.#logger = logger!;
    this.#fetch = fetch;
    this.#queryForwarding = queryForwarding;
    this.#maxConnectionTimeout = maxConnectionTimeout;
    this.#forward = forward;
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

    const establishConnection = new Promise<void>((resolve, reject) => {
      events.addEventListener("open", () => {
        this.#logger.info(`Connected to ${this.#source}`);
        events.removeEventListener("error", reject);

        if (this.#forward !== false) {
          this.#startForwarding();
        }
        resolve();
      });
      events.addEventListener("error", reject);
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

    if (this.#maxConnectionTimeout !== undefined) {
      const timeoutConnection = new Promise<void>((_, reject) => {
        setTimeout(async () => {
          if (events.readyState === EventSource.OPEN) {
            // If the connection is already open, we don't need to reject
            return;
          }

          this.#logger.error(
            `Connection to ${this.#source} timed out after ${this.#maxConnectionTimeout}ms`,
          );
          reject(
            new Error(
              `Connection to ${this.#source} timed out after ${this.#maxConnectionTimeout}ms`,
            ),
          );
          await this.stop();
        }, this.#maxConnectionTimeout)?.unref();
      });
      await Promise.race([establishConnection, timeoutConnection]);
    } else {
      await establishConnection;
    }

    return events;
  }

  async stop() {
    if (this.#events) {
      this.#stopForwarding();
      this.#events.close();
      this.#events = null as any;
      this.#forward = undefined;
      this.#logger.info("Connection closed");
    }
  }

  #startForwarding() {
    if (this.#forward === true) {
      return;
    }
    this.#forward = true;
    this.#logger.info(`Forwarding ${this.#source} to ${this.#target}`);
  }

  startForwarding() {
    if (this.#forward === true) {
      this.#logger.info(
        `Forwarding ${this.#source} to ${this.#target} is already enabled`,
      );
      return;
    }
    this.#startForwarding();
  }

  #stopForwarding() {
    if (this.#forward !== true) {
      return;
    }
    this.#forward = false;
    this.#logger.info(`Stopped forwarding ${this.#source} to ${this.#target}`);
  }

  stopForwarding() {
    if (this.#forward !== true) {
      this.#logger.info(
        `Forwarding ${this.#source} to ${this.#target} is already disabled`,
      );
      return;
    }
    this.#stopForwarding();
  }
}

export {
  SmeeClient as default,
  SmeeClient as "module.exports", // For require(esm) compatibility
  SmeeClient,
};
