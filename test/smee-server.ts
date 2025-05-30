import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from "node:http";
import getPort from "get-port";

function sse(
  req: IncomingMessage,
  res: ServerResponse,
): (obj: Record<string, any>, type?: string | undefined) => void {
  req.socket.setTimeout(0);
  res.statusCode = 200;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  let message_count = 0;

  return (obj, type) => {
    res.write("id: " + ++message_count + "\n");
    if ("string" === typeof type) {
      res.write("event: " + type + "\n");
    }
    res.write("data: " + JSON.stringify(obj) + "\n\n");
  };
}

type SmeeServerOptions = {
  host?: string;
  port?: number;
};

export class SmeeServer {
  #server: ReturnType<typeof createServer>;
  #port: number;
  #host: string;
  #channelId: string = Math.random().toString(36).substring(2, 15);
  #emit?: Awaited<ReturnType<typeof sse>>;

  constructor({ host, port }: SmeeServerOptions = {}) {
    this.#port = port ?? 0;
    this.#host = host ?? "localhost";

    this.#server = createServer(
      async (req: IncomingMessage, res: ServerResponse) => {
        const url = new URL(req.url!, `http://${this.#host}:${this.#port}`);

        if (req.method === "HEAD" && url.pathname === "/new") {
          res.writeHead(307, {
            location: `http://${this.#host}:${this.#port}/${this.#channelId}`,
          });
          res.end();
        } else if (
          req.method === "GET" &&
          url.pathname === `/${this.#channelId}`
        ) {
          if (this.#emit) {
            // If there is an existing connection, close it before creating a new one
            this.#emit({}, "close");
          }
          this.#emit = sse(req, res);
          this.#emit({}, "ready");
        } else {
          res.writeHead(404).end();
        }
      },
    );
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
    this.#emit = undefined;

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

  emit(obj: Record<string, any>, type?: string): void {
    if (this.#emit) {
      return this.#emit(obj, type);
    } else {
      throw new Error("No SSE connection established.");
    }
  }

  get host(): string {
    return this.#host;
  }

  get port(): number {
    return this.#port;
  }

  get channelId(): string {
    return this.#channelId;
  }

  get url(): string {
    return `http://${this.#host}:${this.#port}`;
  }

  get channelUrl(): string {
    return `http://${this.#host}:${this.#port}/${this.#channelId}`;
  }

  get newUrl(): string {
    return `http://${this.#host}:${this.#port}/new`;
  }
}
