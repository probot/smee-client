import {
  createServer,
  Server as HttpServer,
  type IncomingMessage,
  type ServerResponse,
} from "node:http";
import getPort from "get-port";
import type { AddressInfo } from "node:net";

type WebhookServerOptions = {
  host?: string;
  port?: number;
  handler: (req: IncomingMessage, res: ServerResponse) => void | Promise<void>;
};

export class WebhookServer {
  #server: ReturnType<typeof createServer>;
  #port: number;
  #host: string;
  #handler: (req: IncomingMessage, res: ServerResponse) => void;

  constructor({ host, port, handler }: WebhookServerOptions) {
    this.#port = port ?? 0;
    this.#host = host ?? "localhost";
    this.#handler = handler;
    this.#server = new HttpServer();
  }

  async start(): Promise<void> {
    this.#port = await getPort({ port: this.#port });
    this.#server.removeAllListeners("request");
    this.#server.on("request", this.#handler);

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
            const {
              address: host,
              port,
              family,
            } = this.#server.address() as AddressInfo;
            this.#host = family === "IPv6" ? `[${host}]` : host;
            this.#port = port;
            resolve();
          }
        },
      );
    });
  }

  async stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.#server.closeAllConnections();
      this.#server.close((err?: Error) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  get host(): string {
    return this.#host;
  }

  get port(): number {
    return this.#port;
  }
}
