import validator from "validator";
import EventSource from "eventsource";
import url from "url";
import querystring from "querystring";

type Severity = "info" | "error";

interface Options {
  source: string;
  target: string;
  logger?: Pick<Console, Severity>;
  fetch?: any;
}

class Client {
  source: string;
  target: string;
  fetch: typeof global.fetch;
  logger: Pick<Console, Severity>;
  events!: EventSource;

  constructor({
    source,
    target,
    logger = console,
    fetch = global.fetch,
  }: Options) {
    this.source = source;
    this.target = target;
    this.logger = logger!;
    this.fetch = fetch;

    if (!validator.isURL(this.source)) {
      throw new Error("The provided URL is invalid.");
    }
  }

  static async createChannel({ fetch = global.fetch } = {}) {
    const response = await fetch("https://smee.io/new", {
      method: "HEAD",
      redirect: "manual",
    });
    const address = response.headers.get("location");
    if (!address) {
      throw new Error("Failed to create channel");
    }
    return address;
  }

  async onmessage(msg: any) {
    const data = JSON.parse(msg.data);

    const target = url.parse(this.target, true);
    const mergedQuery = { ...target.query, ...data.query };
    target.search = querystring.stringify(mergedQuery);

    delete data.query;

    // Remove the host header, leaving it causes issues with SNI and TLS verification
    delete data.host;

    const body = JSON.stringify(data.body);
    delete data.body;

    const headers: { [key: string]: any } = {};

    Object.keys(data).forEach((key) => {
      headers[key] = data[key];
    });

    headers["content-length"] = Buffer.byteLength(body);

    try {
      const response = await this.fetch(url.format(target), {
        method: "POST",
        mode: data["sec-fetch-mode"],
        cache: "default",
        body,
        headers,
      });
      this.logger.info(`POST ${response.url} - ${response.status}`);
    } catch (err) {
      this.logger.error(err);
    }
  }

  onopen() {
    this.logger.info("Connected", this.events.url);
  }

  onerror(err: any) {
    this.logger.error(err);
  }

  start() {
    const events = new EventSource(this.source);

    // Reconnect immediately
    (events as any).reconnectInterval = 0; // This isn't a valid property of EventSource

    events.addEventListener("message", this.onmessage.bind(this));
    events.addEventListener("open", this.onopen.bind(this));
    events.addEventListener("error", this.onerror.bind(this));

    this.logger.info(`Forwarding ${this.source} to ${this.target}`);
    this.events = events;

    return events;
  }
}

export = Client;
