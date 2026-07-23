import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { ADDON_PORT, getCatalog, getMeta, getPosterSvg, getStreams, manifest } from "./catalog.js";

const rootDir = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const publicDir = join(rootDir, "public");

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".svg": "image/svg+xml; charset=utf-8"
};

const corsHeaders = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, OPTIONS",
  "access-control-allow-headers": "*"
};

function sendJson(response, statusCode, body) {
  const cacheMaxAge = Number.isInteger(body.cacheMaxAge) ? body.cacheMaxAge : null;
  response.writeHead(statusCode, {
    ...corsHeaders,
    ...(cacheMaxAge !== null ? { "cache-control": `public, max-age=${cacheMaxAge}` } : {}),
    "content-type": "application/json; charset=utf-8"
  });
  response.end(JSON.stringify(body, null, 2));
}

function sendText(response, statusCode, contentType, body) {
  response.writeHead(statusCode, {
    ...corsHeaders,
    "content-type": contentType
  });
  response.end(body);
}

function sendCacheableText(response, statusCode, contentType, body, cacheMaxAge) {
  response.writeHead(statusCode, {
    ...corsHeaders,
    "cache-control": `public, max-age=${cacheMaxAge}`,
    "content-type": contentType
  });
  response.end(body);
}

async function sendPublicFile(response, pathname) {
  const fileName = pathname === "/" ? "index.html" : pathname.slice(1);
  const filePath = join(publicDir, fileName);
  const contentType = contentTypes[extname(filePath)] || "text/plain; charset=utf-8";

  try {
    const body = await readFile(filePath, "utf8");
    sendText(response, 200, contentType, body);
  } catch {
    sendJson(response, 404, { error: "Not found" });
  }
}

function decodePathSegment(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function parseExtraProps(value) {
  return Object.fromEntries(new URLSearchParams(value || "").entries());
}

async function handleAddonRoute(request, response, pathname) {
  if (request.method === "OPTIONS") {
    sendText(response, 204, "text/plain; charset=utf-8", "");
    return true;
  }

  if (pathname === "/manifest.json") {
    sendJson(response, 200, manifest);
    return true;
  }

  const posterMatch = pathname.match(/^\/poster\/(.+)\.svg$/);
  if (posterMatch) {
    const svg = await getPosterSvg(decodePathSegment(posterMatch[1]));
    if (svg) {
      sendCacheableText(response, 200, "image/svg+xml; charset=utf-8", svg, 60);
    } else {
      sendJson(response, 404, { error: "Poster not found" });
    }
    return true;
  }

  const catalogMatch = pathname.match(/^\/catalog\/([^/]+)\/([^/]+)(?:\/(.+))?\.json$/);
  if (catalogMatch) {
    const [, type, id, extraProps] = catalogMatch;
    sendJson(
      response,
      200,
      await getCatalog(
        decodePathSegment(type),
        decodePathSegment(id),
        parseExtraProps(extraProps)
      )
    );
    return true;
  }

  const metaMatch = pathname.match(/^\/meta\/([^/]+)\/([^/.]+)\.json$/);
  if (metaMatch) {
    const [, type, id] = metaMatch;
    sendJson(response, 200, await getMeta(decodePathSegment(type), decodePathSegment(id)));
    return true;
  }

  const streamMatch = pathname.match(/^\/stream\/([^/]+)\/([^/.]+)\.json$/);
  if (streamMatch) {
    const [, type, id] = streamMatch;
    sendJson(response, 200, await getStreams(decodePathSegment(type), decodePathSegment(id)));
    return true;
  }

  return false;
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);

  if (await handleAddonRoute(request, response, url.pathname)) {
    return;
  }

  await sendPublicFile(response, url.pathname);
});

server.listen(ADDON_PORT, "0.0.0.0", () => {
  console.log(`FPP TV Stremio addon listening on http://localhost:${ADDON_PORT}`);
});
