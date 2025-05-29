import Client from "../index.ts";
import { describe, test, expect } from "vitest";
import { IncomingMessage, ServerResponse } from "node:http";
import { SmeeServer } from "./smee-server.ts";
import { WebhookServer } from "./webhook-server.ts";
import { VoidLogger } from "./void-logger.ts";

describe("queryForwarding", () => {
  test("forwards query parameters from source to target", async () => {
    const smeeServer = new SmeeServer();
    const webhookServer = new WebhookServer();

    await smeeServer.start();

    webhookServer.handler = async (
      req: IncomingMessage,
      res: ServerResponse,
    ) => {
      const url = new URL(req.url!, `http://${req.headers.host}`);

      expect(url.searchParams.get("foo")).toBe("bar");
      expect(url.searchParams.get("baz")).toBe("qux");
      res.writeHead(200).end("OK");
    };

    await webhookServer.start();

    const smeeClient = new Client({
      source: `http://${smeeServer.host}:${smeeServer.port}/events`,
      target: `http://${webhookServer.host}:${webhookServer.port}/`,
      queryForwarding: true,
      logger: new VoidLogger(),
    });

    await smeeClient.start();

    smeeServer.emit(
      {
        body: {},
        query: {
          foo: "bar",
          baz: "qux",
        },
      },
      "message",
    );

    await new Promise((resolve) => setTimeout(resolve, 500));

    smeeClient.stop();
    await smeeServer.stop();
    await webhookServer.stop();
  });

  test("does not forward query parameters from source to target if queryForwarding is false", async () => {
    const smeeServer = new SmeeServer();
    const webhookServer = new WebhookServer();

    await smeeServer.start();

    webhookServer.handler = async (
      req: IncomingMessage,
      res: ServerResponse,
    ) => {
      const url = new URL(req.url!, `http://${req.headers.host}`);

      expect(url.searchParams.get("foo")).toBe(null);
      expect(url.searchParams.get("baz")).toBe(null);
      res.writeHead(200).end("OK");
    };

    await webhookServer.start();

    const smeeClient = new Client({
      source: `http://${smeeServer.host}:${smeeServer.port}/events`,
      target: `http://${webhookServer.host}:${webhookServer.port}/`,
      queryForwarding: false,
      logger: new VoidLogger(),
    });

    await smeeClient.start();

    smeeServer.emit(
      {
        body: {},
        query: {
          foo: "bar",
          baz: "qux",
        },
      },
      "message",
    );

    await new Promise((resolve) => setTimeout(resolve, 500));

    smeeClient.stop();
    await smeeServer.stop();
    await webhookServer.stop();
  });
});
