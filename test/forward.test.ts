import { describe, test, expect } from "vitest";

import { SmeeServer } from "./helpers/smee-server.ts";
import { WebhookServer } from "./helpers/webhook-server.ts";
import { VoidLogger } from "./helpers/void-logger.ts";

import Client from "../index.ts";

describe("forward", () => {
  test("by default forwards from source to target", async () => {
    const requestCalls: any[] = [];

    const webhookServer = new WebhookServer({
      handler: async (req, res) => {
        requestCalls.push(req);
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
        body: {
          foo: "bar",
          baz: "qux",
        },
      },
      "message",
    );

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(requestCalls).toHaveLength(1);

    await smeeClient.stop();
    await smeeServer.stop();
    await webhookServer.stop();
  });

  test("should be able to stop forwarding by using stopForwarding()", async () => {
    const requestCalls: any[] = [];

    const webhookServer = new WebhookServer({
      handler: async (req, res) => {
        requestCalls.push(req);
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

    smeeClient.stopForwarding();

    smeeServer.emit(
      {
        body: {
          foo: "bar",
          baz: "qux",
        },
      },
      "message",
    );

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(requestCalls).toHaveLength(0);

    await smeeClient.stop();
    await smeeServer.stop();
    await webhookServer.stop();
  });

  test("should be able to start forwarding by using startForwarding()", async () => {
    const requestCalls: any[] = [];

    const webhookServer = new WebhookServer({
      handler: async (req, res) => {
        requestCalls.push(req);
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

    smeeClient.stopForwarding();

    smeeServer.emit(
      {
        body: {
          foo: "bar",
          baz: "qux",
        },
      },
      "message",
    );

    await new Promise((resolve) => setTimeout(resolve, 50));

    smeeClient.startForwarding();

    smeeServer.emit(
      {
        body: {
          foo: "bar",
          baz: "qux",
        },
      },
      "message",
    );

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(requestCalls).toHaveLength(1);

    await smeeClient.stop();
    await smeeServer.stop();
    await webhookServer.stop();
  });

  test("if forward is false, should be able to start forwarding by using startForwarding()", async () => {
    const requestCalls: any[] = [];

    const webhookServer = new WebhookServer({
      handler: async (req, res) => {
        requestCalls.push(req);
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
      forward: false,
    });

    await smeeClient.start();

    smeeServer.emit(
      {
        body: {
          foo: "bar",
          baz: "qux",
        },
      },
      "message",
    );

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(requestCalls).toHaveLength(0);

    smeeClient.startForwarding();

    smeeServer.emit(
      {
        body: {
          foo: "bar",
          baz: "qux",
        },
      },
      "message",
    );

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(requestCalls).toHaveLength(1);

    await smeeClient.stop();
    await smeeServer.stop();
    await webhookServer.stop();
  });
});
