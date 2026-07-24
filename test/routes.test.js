import assert from "node:assert/strict";
import { test } from "node:test";

import { handleRequest } from "../src/http/routes.js";
import { resolvePublicPath } from "../src/http/static.js";

test("serves manifest JSON", async () => {
  const response = await dispatch("/manifest.json");

  assert.equal(response.statusCode, 200);
  assert.equal(response.headers["content-type"], "application/json; charset=utf-8");
  assert.equal(JSON.parse(response.body).id, "com.skmobi.fpptv");
});

test("routes catalog requests and parses extra props", async () => {
  let call;
  const addon = {
    getCatalog: async (...args) => {
      call = args;
      return { metas: [], cacheMaxAge: 60 };
    }
  };

  const response = await dispatch("/catalog/channel/fpp-tv/genre=Hoquei%20em%20Patins.json", {
    addon
  });

  assert.equal(response.statusCode, 200);
  assert.deepEqual(call, ["channel", "fpp-tv", { genre: "Hoquei em Patins" }]);
  assert.equal(response.headers["cache-control"], "public, max-age=60");
});

test("routes meta, stream, and poster requests", async () => {
  const addon = {
    getMeta: async (type, id) => ({ meta: { id: `${type}:${id}` } }),
    getStreams: async (type, id) => ({ streams: [{ name: `${type}:${id}` }] }),
    getPosterSvg: async (id) => `<svg>${id}</svg>`
  };

  const meta = await dispatch("/meta/channel/fpptv%3Aevent%3Arecent%3Ae-1.json", { addon });
  const stream = await dispatch("/stream/channel/fpptv%3Aevent%3Arecent%3Ae-1.json", { addon });
  const poster = await dispatch("/poster/fpptv%3Aevent%3Arecent%3Ae-1.svg", { addon });

  assert.equal(JSON.parse(meta.body).meta.id, "channel:fpptv:event:recent:e-1");
  assert.equal(JSON.parse(stream.body).streams[0].name, "channel:fpptv:event:recent:e-1");
  assert.equal(poster.headers["content-type"], "image/svg+xml; charset=utf-8");
  assert.equal(poster.headers["cache-control"], "public, max-age=60");
});

test("serves static root and rejects missing or traversal paths", async () => {
  const root = await dispatch("/");
  const missing = await dispatch("/missing.svg");

  assert.equal(root.statusCode, 200);
  assert.equal(root.headers["content-type"], "text/html; charset=utf-8");
  assert.equal(missing.statusCode, 404);
  assert.equal(resolvePublicPath("/%2e%2e/package.json"), null);
});

test("handles OPTIONS and rejects unsupported methods", async () => {
  const options = await dispatch("/manifest.json", { method: "OPTIONS" });
  const post = await dispatch("/manifest.json", { method: "POST" });

  assert.equal(options.statusCode, 204);
  assert.equal(post.statusCode, 405);
  assert.equal(post.headers.allow, "GET, OPTIONS");
});

async function dispatch(path, { method = "GET", addon } = {}) {
  const response = new MockResponse();
  await handleRequest(
    {
      method,
      url: path,
      headers: { host: "localhost:7000" }
    },
    response,
    addon ? { addon } : undefined
  );
  return response;
}

class MockResponse {
  statusCode = null;
  headers = {};
  body = "";

  writeHead(statusCode, headers) {
    this.statusCode = statusCode;
    this.headers = headers;
  }

  end(body = "") {
    this.body = body;
  }
}
