import { describe, test, expect } from "vitest";

import { SmeeServer } from "./smee-server.ts";
import { VoidLogger } from "./void-logger.ts";
import { WebhookServer } from "./webhook-server.ts";

import SmeeClient from "../index.ts";

describe("onerror", () => {
  test("logs correctly an error if the server closes connection unexpectedly", async () => {
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

    await smeeClient.start();

    await smeeServer.stop();

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(logger.errorCalls.length).toBe(1);
    expect(logger.errorCalls[0][0]).toBe("Error in connection");
    expect(logger.errorCalls[0][1].message).toBe(
      "TypeError: terminated: other side closed",
    );

    await smeeClient.stop();
    await webhookServer.stop();
  });

  test("overriding onerror before starting the client works accordingly", async () => {
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

    smeeClient.onerror = (err) => {
      logger.error("Custom error handler", err);
    };

    expect(typeof smeeClient.onerror).toBe("function");

    await smeeClient.start();
    await smeeServer.stop();

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(typeof smeeClient.onerror).toBe("function");

    expect(logger.errorCalls.length).toBe(2);
    expect(logger.errorCalls[0][0]).toBe("Custom error handler");
    expect(logger.errorCalls[0][1].message).toBe(
      "TypeError: terminated: other side closed",
    );
    expect(logger.errorCalls[1][0]).toBe("Error in connection");
    expect(logger.errorCalls[1][1].message).toBe(
      "TypeError: terminated: other side closed",
    );

    await smeeClient.stop();
    await webhookServer.stop();
  });

  test("resetting onerror before starting the client works accordingly", async () => {
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

    smeeClient.onerror = (err) => {
      logger.error("Custom error handler", err);
    };

    expect(typeof smeeClient.onerror).toBe("function");

    smeeClient.onerror = null;

    await smeeClient.start();
    await smeeServer.stop();

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(smeeClient.onerror).toBe(null);

    expect(logger.errorCalls.length).toBe(1);
    expect(logger.errorCalls[0][0]).toBe("Error in connection");
    expect(logger.errorCalls[0][1].message).toBe(
      "TypeError: terminated: other side closed",
    );

    await smeeClient.stop();
    await webhookServer.stop();
  });

  test("overriding onerror before and after starting the client works accordingly", async () => {
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

    smeeClient.onerror = (err) => {
      logger.error("Wrong error handler", err);
    };

    await smeeClient.start();

    smeeClient.onerror = (err) => {
      logger.error("Custom error handler", err);
    };
    await smeeServer.stop();

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(logger.errorCalls.length).toBe(2);

    expect(logger.errorCalls[0][0]).toBe("Custom error handler");
    expect(logger.errorCalls[0][1].message).toBe(
      "TypeError: terminated: other side closed",
    );
    expect(logger.errorCalls[1][0]).toBe("Error in connection");
    expect(logger.errorCalls[1][1].message).toBe(
      "TypeError: terminated: other side closed",
    );

    await smeeClient.stop();
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
      smeeClient.onerror = "string";
      throw new Error("Should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(TypeError);
      expect(err.message).toBe("onerror must be a function or null");
    }

    await smeeClient.stop();
    await webhookServer.stop();
  });
});
