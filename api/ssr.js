import server from "../dist/server/server.js";
import { Readable } from "node:stream";

export default async function handler(req, res) {
  const protocol = req.headers["x-forwarded-proto"] || "https";
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  const url = new URL(req.url, `${protocol}://${host}`);

  const headers = new Headers();
  for (const [key, val] of Object.entries(req.headers)) {
    if (val !== undefined) {
      Array.isArray(val)
        ? val.forEach((v) => headers.append(key, v))
        : headers.set(key, val);
    }
  }

  const hasBody = req.method !== "GET" && req.method !== "HEAD";
  const request = new Request(url.toString(), {
    method: req.method,
    headers,
    ...(hasBody ? { body: Readable.toWeb(req), duplex: "half" } : {}),
  });

  const response = await server.fetch(request);

  res.status(response.status);
  for (const [key, val] of response.headers) {
    if (key !== "transfer-encoding") res.setHeader(key, val);
  }

  if (response.body) {
    const reader = response.body.getReader();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(value);
    }
  }
  res.end();
}
