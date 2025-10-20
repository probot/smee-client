import { describe, test, expect } from "vitest";

import { SmeeServer } from "./helpers/smee-server.ts";
import { VoidLogger } from "./helpers/void-logger.ts";
import { WebhookServer } from "./helpers/webhook-server.ts";

import SmeeClient from "../index.ts";
import { randomInt } from "node:crypto";

describe("connection", () => {
  test("should emit an error if the server closes connection unexpectedly", async () => {
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

    const errored = new Promise((resolve) => {
      smeeClient.onerror = resolve;
    });
    await smeeServer.stop();

    await errored;

    expect(logger.errorCalls.length).toBe(1);
    expect(logger.errorCalls[0][0]).toBe("Error in connection");
    expect(logger.errorCalls[0][1].message).toBe(
      "TypeError: terminated: other side closed",
    );

    expect(logger.infoCalls.length).toBe(2);
    expect(logger.infoCalls[0][0]).toBe(
      `Connected to ${smeeServer.channelUrl}`,
    );
    expect(logger.infoCalls[1][0]).toBe(
      `Forwarding ${smeeServer.channelUrl} to ${webhookServer.url}`,
    );

    await smeeClient.stop();
    await webhookServer.stop();
  });

  test("logs an error when the server is not found", async () => {
    const domain = "bad.n" + randomInt(1e10).toString(36) + ".proxy";
    const url = `http://${domain}/events`;

    const logger = new VoidLogger();

    try {
      const smeeClient = new SmeeClient({
        source: url,
        target: "http://localhost:3000",
        logger,
      });
      await smeeClient.start();
      throw new Error("Expected an error to be thrown");
    } catch (error: any) {
      expect(logger.errorCalls.length).toBe(1);
      expect(logger.errorCalls[0].length).toBe(2);
      expect(logger.errorCalls[0][0]).toBe("Error in connection");
    }
  });
});
