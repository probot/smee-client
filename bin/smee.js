#!/usr/bin/env node

import { parseArgs } from "node:util";
import { readFile } from "node:fs/promises";
import Client from "../index.js";

const { version } = JSON.parse(
  await readFile(new URL("../package.json", import.meta.url)),
);

const { values: options } = parseArgs({
  options: {
    version: {
      type: "boolean",
      short: "v",
      default: false,
    },
    help: {
      type: "boolean",
      short: "h",
      default: false,
    },
    url: {
      type: "string",
      short: "u",
      default: "https://smee.io/new",
    },
    target: {
      type: "string",
      short: "t",
    },
    path: {
      type: "string",
      short: "P",
      default: "/",
    },
    port: {
      type: "string",
      short: "p",
      default: process.env.PORT || "3000",
    },
  },
});

if (options.help) {
  console.log(`Usage: smee [options]

Options:
  -v, --version         Display the version number
  -u, --url <url>       URL of the webhook proxy service. Default: https://smee.io/new
  -t, --target <target> Full URL (including protocol and path) of the target service the events will forwarded to.
                        Default: http://127.0.0.1:PORT/PATH
  -p, --port <n>        Local HTTP server port. Default: 3000
  -P, --path <path>     URL path to post proxied requests to. Default: "/"
  -h, --help            Display this help message`);
} else if (options.version) {
  console.log(version);
} else {
  const { target = `http://127.0.0.1:${options.port}${options.path}` } =
    options;

  async function setup() {
    const source = options.url ?? (await Client.createChannel());

    const client = new Client({ source, target });
    client.start();
  }

  setup();
}
