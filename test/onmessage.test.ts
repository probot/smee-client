import { describe, test, expect } from "vitest";

import { SmeeServer } from "./helpers/smee-server.ts";
import { VoidLogger } from "./helpers/void-logger.ts";
import { WebhookServer } from "./helpers/webhook-server.ts";

import SmeeClient from "../index.ts";

describe("onmessage", () => {
  test("overriding onmessage before starting the client works accordingly", async () => {
    const webhookServer = new WebhookServer({
      handler: async (req, res) => {
        res.writeHead(200).end("OK");
      },
    });
    await webhookServer.start();

    const smeeServer = new SmeeServer();
    await smeeServer.start();

    const logger = new VoidLogger();

    const smeeClient = new SmeeClient({
      source: smeeServer.channelUrl,
      target: webhookServer.url,
      logger,
    });

    expect(smeeClient.onmessage).toBe(null);

    smeeClient.onmessage = (err) => {
      logger.info("Custom message handler", err);
    };

    expect(typeof smeeClient.onmessage).toBe("function");

    await smeeClient.start();

    smeeServer.emit(
      {
        query: {},
        body: JSON.stringify({ message: "test" }),
      },
      "message",
    );
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(typeof smeeClient.onmessage).toBe("function");

    expect(logger.errorCalls.length).toBe(0);

    expect(logger.infoCalls.length).toBe(4);
    expect(logger.infoCalls[0][0]).toBe(
      `Connected to ${smeeServer.channelUrl}`,
    );
    expect(logger.infoCalls[1][0]).toBe(
      `Forwarding ${smeeServer.channelUrl} to ${webhookServer.url}`,
    );
    expect(logger.infoCalls[2][0]).toBe(`Custom message handler`);
    expect(logger.infoCalls[3][0]).toBe(`POST ${webhookServer.url}/ - 200`);

    await smeeClient.stop();
    await smeeServer.stop();
    await webhookServer.stop();
  });

  test("resetting onmessage before starting the client works accordingly", async () => {
    const webhookServer = new WebhookServer({
      handler: async (req, res) => {
        res.writeHead(200).end("OK");
      },
    });
    await webhookServer.start();

    const smeeServer = new SmeeServer();
    await smeeServer.start();

    const logger = new VoidLogger();

    const smeeClient = new SmeeClient({
      source: smeeServer.channelUrl,
      target: webhookServer.url,
      logger,
    });

    smeeClient.onmessage = () => {
      logger.info("Custom message handler");
    };

    expect(typeof smeeClient.onmessage).toBe("function");

    smeeClient.onmessage = null;

    await smeeClient.start();

    smeeServer.emit(
      {
        query: {},
        body: JSON.stringify({ message: "test" }),
      },
      "message",
    );

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(smeeClient.onmessage).toBe(null);

    expect(logger.errorCalls.length).toBe(0);

    expect(logger.infoCalls.length).toBe(3);
    expect(logger.infoCalls[0][0]).toBe(
      `Connected to ${smeeServer.channelUrl}`,
    );
    expect(logger.infoCalls[1][0]).toBe(
      `Forwarding ${smeeServer.channelUrl} to ${webhookServer.url}`,
    );
    expect(logger.infoCalls[2][0]).toBe(`POST ${webhookServer.url}/ - 200`);

    await smeeClient.stop();
    await smeeServer.stop();
    await webhookServer.stop();
  });

  test("overriding onmessage before and after starting the client works accordingly", async () => {
    const webhookServer = new WebhookServer({
      handler: async (req, res) => {
        res.writeHead(200).end("OK");
      },
    });
    await webhookServer.start();

    const smeeServer = new SmeeServer();
    await smeeServer.start();

    const logger = new VoidLogger();

    const smeeClient = new SmeeClient({
      source: smeeServer.channelUrl,
      target: webhookServer.url,
      logger,
    });

    smeeClient.onmessage = () => {
      logger.info("Wrong message handler");
    };

    await smeeClient.start();

    smeeClient.onmessage = () => {
      logger.info("Custom message handler");
    };

    smeeServer.emit(
      {
        query: {},
        body: JSON.stringify({ message: "test" }),
      },
      "message",
    );

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(logger.errorCalls.length).toBe(0);

    expect(logger.infoCalls.length).toBe(4);
    expect(logger.infoCalls[0][0]).toBe(
      `Connected to ${smeeServer.channelUrl}`,
    );
    expect(logger.infoCalls[1][0]).toBe(
      `Forwarding ${smeeServer.channelUrl} to ${webhookServer.url}`,
    );
    expect(logger.infoCalls[2][0]).toBe("Custom message handler");
    expect(logger.infoCalls[3][0]).toBe(`POST ${webhookServer.url}/ - 200`);

    await smeeClient.stop();
    await smeeServer.stop();
    await webhookServer.stop();
  });

  test("should throw an error if eventListener is not null or a function", async () => {
    const webhookServer = new WebhookServer({
      handler: async (req, res) => {
        res.writeHead(200).end("OK");
      },
    });
    await webhookServer.start();

    const smeeServer = new SmeeServer();
    await smeeServer.start();

    const logger = new VoidLogger();

    const smeeClient = new SmeeClient({
      source: smeeServer.channelUrl,
      target: webhookServer.url,
      logger,
    });

    try {
      // @ts-expect-error Testing invalid type
      smeeClient.onmessage = "string";
      throw new Error("Should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(TypeError);
      expect(err.message).toBe("onmessage must be a function or null");
    }

    await smeeClient.stop();
    await smeeServer.stop();
    await webhookServer.stop();
  });
});
