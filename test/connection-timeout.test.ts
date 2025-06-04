import { describe, test, expect } from "vitest";

import { SmeeServer } from "./helpers/smee-server.ts";
import { VoidLogger } from "./helpers/void-logger.ts";
import { WebhookServer } from "./helpers/webhook-server.ts";

import SmeeClient from "../index.ts";

describe("connection timeout", () => {
  test("should throw a connection timeout", async () => {
    const webhookServer = new WebhookServer({
      handler: async (req, res) => {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        res.writeHead(200).end("OK");
      },
    });
    await webhookServer.start();

    const smeeServer = new SmeeServer();
    await smeeServer.start();

    const logger = new VoidLogger();

    const smeeClient = new SmeeClient({
      source: webhookServer.url,
      target: webhookServer.url,
      maxConnectionTimeout: 500,
      logger,
    });

    expect(smeeClient.onopen).toBe(null);
    expect(logger.infoCalls.length).toBe(0);

    try {
      await smeeClient.start();
      throw new Error("Expected start to throw due to timeout");
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe(
        `Connection to ${webhookServer.url} timed out after 500ms`,
      );
    }

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(logger.errorCalls.length).toBe(1);
    expect(logger.errorCalls[0][0]).toBe(
      `Connection to ${webhookServer.url} timed out after 500ms`,
    );

    expect(logger.infoCalls.length).toBe(1);
    expect(logger.infoCalls[0][0]).toBe(`Connection closed`);

    await smeeClient.stop();
    await smeeServer.stop();
    await webhookServer.stop();
  });
});
