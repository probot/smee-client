import { describe, test, expect } from "vitest";

import { SmeeServer } from "./helpers/smee-server.ts";
import { VoidLogger } from "./helpers/void-logger.ts";
import { WebhookServer } from "./helpers/webhook-server.ts";

import SmeeClient from "../index.ts";

describe("onopen", () => {
  test("logs correctly an open if the server opens a connection to the smee server", async () => {
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

    expect(smeeClient.onopen).toBe(null);
    expect(logger.infoCalls.length).toBe(0);

    await smeeClient.start();

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(logger.errorCalls.length).toBe(0);

    expect(logger.infoCalls.length).toBe(2);
    expect(logger.infoCalls[0][0]).toBe(
      `Forwarding ${smeeServer.channelUrl} to ${webhookServer.url}`,
    );
    expect(logger.infoCalls[1][0]).toBe(
      `Connected to ${smeeServer.channelUrl}`,
    );

    await smeeClient.stop();
    await smeeServer.stop();
    await webhookServer.stop();
  });

  test("overriding onopen before starting the client works accordingly", async () => {
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

    smeeClient.onopen = (err) => {
      logger.info("Correct open handler", err);
    };

    expect(typeof smeeClient.onopen).toBe("function");

    await smeeClient.start();

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(typeof smeeClient.onopen).toBe("function");

    expect(logger.errorCalls.length).toBe(0);

    expect(logger.infoCalls.length).toBe(3);
    expect(logger.infoCalls[0][0]).toBe(
      `Forwarding ${smeeServer.channelUrl} to ${webhookServer.url}`,
    );
    expect(logger.infoCalls[1][0]).toBe("Correct open handler");
    expect(logger.infoCalls[2][0]).toBe(
      `Connected to ${smeeServer.channelUrl}`,
    );

    await smeeClient.stop();
    await smeeServer.stop();
    await webhookServer.stop();
  });

  test("resetting onopen before starting the client works accordingly", async () => {
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

    smeeClient.onopen = (err) => {
      logger.info("Correct open handler", err);
    };

    expect(typeof smeeClient.onopen).toBe("function");

    smeeClient.onopen = null;

    await smeeClient.start();

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(smeeClient.onopen).toBe(null);

    expect(logger.errorCalls.length).toBe(0);

    expect(logger.infoCalls.length).toBe(2);
    expect(logger.infoCalls[0][0]).toBe(
      `Forwarding ${smeeServer.channelUrl} to ${webhookServer.url}`,
    );
    expect(logger.infoCalls[1][0]).toBe(
      `Connected to ${smeeServer.channelUrl}`,
    );

    await smeeClient.stop();
    await smeeServer.stop();
    await webhookServer.stop();
  });

  test("overriding onopen before and after starting the client works accordingly", async () => {
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

    smeeClient.onopen = () => {
      logger.info("Wrong open handler");
    };

    await smeeClient.start();

    await smeeClient.stop();

    smeeClient.onopen = () => {
      logger.info("Correct open handler");
    };

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(logger.errorCalls.length).toBe(0);

    expect(logger.infoCalls.length).toBe(4);
    expect(logger.infoCalls[0][0]).toBe(
      `Forwarding ${smeeServer.channelUrl} to ${webhookServer.url}`,
    );
    expect(logger.infoCalls[1][0]).toBe("Wrong open handler");
    expect(logger.infoCalls[2][0]).toBe(
      `Connected to ${smeeServer.channelUrl}`,
    );
    expect(logger.infoCalls[3][0]).toBe(`Connection closed`);

    logger.reset();

    await smeeClient.start();
    await smeeClient.stop();

    expect(logger.infoCalls.length).toBe(4);
    expect(logger.infoCalls[0][0]).toBe(
      `Forwarding ${smeeServer.channelUrl} to ${webhookServer.url}`,
    );
    expect(logger.infoCalls[1][0]).toBe("Correct open handler");
    expect(logger.infoCalls[2][0]).toBe(
      `Connected to ${smeeServer.channelUrl}`,
    );
    expect(logger.infoCalls[3][0]).toBe(`Connection closed`);

    await smeeServer.stop();
    await webhookServer.stop();
  });

  test("overriding onopen after starting the client works accordingly", async () => {
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

    smeeClient.onopen = () => {
      logger.info("Wromg open handler");
    };

    await smeeClient.stop();

    expect(smeeClient.onopen).toBe(null);

    smeeClient.onopen = () => {
      logger.info("Correct open handler");
    };

    expect(typeof smeeClient.onopen).toBe("function");

    await new Promise((resolve) => setTimeout(resolve, 100));

    logger.reset();

    await smeeClient.start();

    expect(typeof smeeClient.onopen).toBe("function");

    await smeeClient.stop();

    expect(logger.infoCalls.length).toBe(4);
    expect(logger.infoCalls[0][0]).toBe(
      `Forwarding ${smeeServer.channelUrl} to ${webhookServer.url}`,
    );
    expect(logger.infoCalls[1][0]).toBe("Correct open handler");
    expect(logger.infoCalls[2][0]).toBe(
      `Connected to ${smeeServer.channelUrl}`,
    );
    expect(logger.infoCalls[3][0]).toBe(`Connection closed`);

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
      smeeClient.onopen = "string";
      throw new Error("Should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(TypeError);
      expect(err.message).toBe("onopen must be a function or null");
    }

    await smeeClient.stop();
    await smeeServer.stop();
    await webhookServer.stop();
  });
});
