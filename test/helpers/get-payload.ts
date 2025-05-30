import { Buffer } from "node:buffer";
import type { IncomingMessage } from "node:http";

export function getPayload(request: IncomingMessage): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const body = [] as Buffer[];
    request.on("error", reject);
    request.on("data", onData);
    request.on("end", onEnd);

    function onData(chunk: Buffer) {
      body.push(chunk);
    }

    function onEnd() {
      resolve(Buffer.concat(body).toString("utf8"));
    }
  });
}
