import { describe, test, expect } from "vitest";

import { WebhookServer } from "./helpers/webhook-server.ts";

import SmeeClient from "../index.ts";

describe("createChannel", () => {
  test("extracts the channelUrl from the redirect header", async () => {
    const webhookServer = new WebhookServer({
      handler: async (req, res) => {
        expect(req.method).toBe("HEAD");
        expect(req.url).toBe("/new");
        res
          .writeHead(307, {
            Location: webhookServer.url + "/1234567890",
          })
          .end();
      },
    });
    await webhookServer.start();

    const channelUrl = await SmeeClient.createChannel({
      newChannelUrl: webhookServer.url + "/new",
    });

    expect(channelUrl).toBe(webhookServer.url + "/1234567890");

    await webhookServer.stop();
  });

  test("does not follow the redirect", async () => {
    const channelId = Math.random().toString(36).substring(2, 15);

    let hasRedirected = false;

    const webhookServer = new WebhookServer({
      handler: async (req, res) => {
        if (req.url === `/${channelId}`) {
          hasRedirected = true;
          res.writeHead(200).end();
          return;
        } else if (req.url === "/new") {
          res
            .writeHead(307, {
              Location: webhookServer.url + `/${channelId}`,
            })
            .end();
        } else {
          res.writeHead(404).end();
        }
      },
    });
    await webhookServer.start();

    await SmeeClient.createChannel({
      newChannelUrl: webhookServer.url + "/new",
    });

    expect(hasRedirected).toBe(false);

    await webhookServer.stop();
  });

  test("throws an error if location header is not set", async () => {
    const webhookServer = new WebhookServer({
      handler: async (req, res) => {
        if (req.url === "/new") {
          res.writeHead(307, {}).end();
        } else {
          res.writeHead(404).end();
        }
      },
    });
    await webhookServer.start();

    try {
      await SmeeClient.createChannel({
        newChannelUrl: webhookServer.url + "/new",
      });
      throw new Error("Should have thrown");
    } catch (error) {
      expect(error instanceof Error).toBe(true);
      expect((error as Error).message).toBe("Failed to create channel");
    }

    await webhookServer.stop();
  });
});
