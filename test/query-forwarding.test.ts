import { describe, test, expect } from "vitest";

import { SmeeServer } from "./smee-server.ts";
import { WebhookServer } from "./webhook-server.ts";
import { VoidLogger } from "./void-logger.ts";

import Client from "../index.ts";

describe("queryForwarding", () => {
  test("by default forwards query parameters from source to target", async () => {
    const webhookServer = new WebhookServer({
      handler: async (req, res) => {
        const url = new URL(req.url!, `http://${req.headers.host}`);

        expect(url.searchParams.get("foo")).toBe("bar");
        expect(url.searchParams.get("baz")).toBe("qux");
        res.writeHead(200).end("OK");
      },
    });
    await webhookServer.start();

    const smeeServer = new SmeeServer();
    await smeeServer.start();

    const smeeClient = new Client({
      source: smeeServer.channelUrl,
      target: webhookServer.url,
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

    await smeeClient.stop();
    await smeeServer.stop();
    await webhookServer.stop();
  });

  test("forwards query parameters from source to target", async () => {
    const webhookServer = new WebhookServer({
      handler: async (req, res) => {
        const url = new URL(req.url!, `http://${req.headers.host}`);

        expect(url.searchParams.get("foo")).toBe("bar");
        expect(url.searchParams.get("baz")).toBe("qux");
        res.writeHead(200).end("OK");
      },
    });
    await webhookServer.start();

    const smeeServer = new SmeeServer();
    await smeeServer.start();

    const smeeClient = new Client({
      source: smeeServer.channelUrl,
      target: webhookServer.url,
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

    await smeeClient.stop();
    await smeeServer.stop();
    await webhookServer.stop();
  });

  test("does not forward query parameters from source to target if queryForwarding is false", async () => {
    const webhookServer = new WebhookServer({
      handler: async (req, res) => {
        const url = new URL(req.url!, `http://${req.headers.host}`);

        expect(url.searchParams.get("foo")).toBe(null);
        expect(url.searchParams.get("baz")).toBe(null);
        res.writeHead(200).end("OK");
      },
    });
    await webhookServer.start();

    const smeeServer = new SmeeServer();
    await smeeServer.start();

    const smeeClient = new Client({
      source: smeeServer.channelUrl,
      target: webhookServer.url,
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

    await smeeClient.stop();
    await smeeServer.stop();
    await webhookServer.stop();
  });
});
