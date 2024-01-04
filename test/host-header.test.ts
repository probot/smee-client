import { request } from "undici";
import Client from "../index";
import { describe, test, expect } from "vitest";
import { fastify as Fastify } from "fastify";

describe("host-header", () => {
  test("host is not passed by payload", async () => {
    expect.assertions(1);

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

    const fastify = Fastify();

    fastify.route({
      url: "/",
      method: "POST",
      handler: async (request, reply) => {
        expect(request.headers.host).not.toBe(
          "smee.io"
        );
        finishedPromise.resolve!();
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

    await request(source, {
      method: "POST",
      headers: {
        host: "smee.io",
        "content-type": "application/json",
      },
    })

    await finishedPromise.promise;
  }, { timeout: 10000 });
});
