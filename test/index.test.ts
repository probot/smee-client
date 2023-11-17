import Client from "../index";
import { describe, test, expect } from "vitest";
import { fastify as Fastify } from "fastify";

describe("client", () => {
  describe("createChannel", () => {
    test("returns a new channel", async () => {
      const channel = await Client.createChannel();
      expect(channel).toMatch(/https:\/\/smee\.io\/[0-9a-zA-Z]{10,}/);
    });

    test("throws if could not create a new channel", async () => {
      expect(
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
      expect.assertions(2);

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
      const fastify = Fastify();

      fastify.route({
        url: "/",
        method: "POST",
        handler: async (request, reply) => {
          callCount++;

          expect(JSON.stringify(request.body)).toBe(
            JSON.stringify({ hello: "world" }),
          );

          if (callCount === 2) {
            finishedPromise.resolve!();
          }
          return reply
            .send(request.body)
            .header("content-type", "application/json");
        },
      });

      const target = await fastify.listen();

      const source = await Client.createChannel();
      const client = new Client({
        source,
        target,
      });

      let readyPromise = {
        promise: undefined,
        reject: undefined,
        resolve: undefined,
      } as {
        promise?: Promise<any>;
        resolve?: (value?: any) => any;
        reject?: (reason?: any) => any;
      };

      readyPromise.promise = new Promise((resolve, reject) => {
        readyPromise.resolve = resolve;
        readyPromise.reject = reject;
      });

      client.onopen = readyPromise.resolve!;
      client.onerror = readyPromise.reject!;
      client.start();

      await readyPromise.promise;

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
    });
  });
});
