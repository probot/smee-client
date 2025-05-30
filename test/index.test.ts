import { describe, test, expect } from "vitest";

import { VoidLogger } from "./helpers/void-logger.ts";
import { WebhookServer } from "./helpers/webhook-server.ts";

import Client from "../index.ts";
import { getPayload } from "./helpers/get-payload.ts";

describe("client", () => {
  describe("createChannel", () => {
    test("returns a new channel", async () => {
      const channel = await Client.createChannel();
      expect(channel).toMatch(/^https:\/\/smee\.io\/[0-9a-zA-Z]{10,}$/);
    });

    test("throws if could not create a new channel", async () => {
      await expect(
        Client.createChannel({
          // @ts-ignore
          fetch: async () => {
            return {
              headers: {
                get: () => null,
              },
            };
          },
        }),
      ).rejects.toThrow("Failed to create channel");
    });
  });

  describe("constructor", () => {
    describe("source", () => {
      test("throws if source is not a valid URL", () => {
        expect(
          () =>
            new Client({
              source: "mailto:do-not-reply@example.com",
              target: "https://example.com",
            }),
        ).toThrow("The provided URL is invalid.");
      });
    });
  });

  describe("onmessage", () => {
    test("returns a new channel", async () => {
      expect.assertions(7);

      let finishedPromise = {
        promise: undefined,
        reject: undefined,
        resolve: undefined,
      } as {
        promise?: Promise<any>;
        resolve?: (value?: any) => any;
        reject?: (reason?: any) => any;
      };

      finishedPromise.promise = new Promise((resolve, reject) => {
        finishedPromise.resolve = resolve;
        finishedPromise.reject = reject;
      });

      let callCount = 0;

      const server = new WebhookServer({
        handler: async (req, res) => {
          try {
            expect(req.method).toBe("POST");
            expect(req.url).toBe("/");

            const body = await getPayload(req);

            expect(body).toBe(JSON.stringify({ hello: "world" }));

            res.writeHead(200, { "content-type": "application/json" });
            res.end(body);

            ++callCount;

            if (callCount === 2) {
              finishedPromise.resolve!();
            }
          } catch (err) {
            finishedPromise.reject!(err);
          }
        },
      });

      await server.start();

      const target = server.url;
      const source = await Client.createChannel();

      const client = new Client({
        source,
        target,
        logger: new VoidLogger(),
      });

      await client.start();

      await fetch(target + "/", {
        method: "POST",
        body: JSON.stringify({ hello: "world" }),
        headers: {
          "content-type": "application/json",
        },
      });

      await fetch(source, {
        method: "POST",
        body: JSON.stringify({ hello: "world" }),
        headers: {
          "content-type": "application/json",
        },
      });

      await finishedPromise.promise;

      await server.stop();

      expect(callCount).toBe(2);
    });
  });
});
