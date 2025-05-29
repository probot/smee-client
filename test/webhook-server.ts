import {
  createServer,
  Server as HttpServer,
  type IncomingMessage,
  type ServerResponse,
} from "node:http";
import getPort from "get-port";

type WebhookServerOptions = {
  host?: string;
  port?: number;
  handler?: (req: IncomingMessage, res: ServerResponse) => void;
};

const defaultHandler = (req: IncomingMessage, res: ServerResponse) => {
  res.writeHead(404).end("Not Found");
};

export class WebhookServer {
  #server: ReturnType<typeof createServer>;
  #port: number;
  #host: string;
  #handler: (req: IncomingMessage, res: ServerResponse) => void;

  constructor({ host, port, handler }: WebhookServerOptions = {}) {
    this.#port = port ?? 0;
    this.#host = host ?? "localhost";
    this.#handler = handler || defaultHandler;

    this.#server = new HttpServer();
  }

  async start(): Promise<void> {
    this.#port = await getPort({ port: this.#port });
    return new Promise((resolve, reject) => {
      this.#server.listen(
        {
          port: this.#port,
          host: this.#host,
        },
        (err?: Error) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        },
      );
    });
  }

  async stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.#server.close((err?: Error) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  set handler(handler: (req: IncomingMessage, res: ServerResponse) => void) {
    this.#server.removeListener("request", this.#handler);
    this.#handler = handler;
    this.#server.on("request", this.#handler);
  }

  get host(): string {
    return this.#host;
  }

  get port(): number {
    return this.#port;
  }
}
