import { getCatalog, getMeta, getPosterSvg, getStreams } from "../addon.js";
import { manifest } from "../manifest.js";
import { sendError, sendJson, sendResponse } from "./respond.js";
import { sendPublicFile } from "./static.js";

const defaultAddon = { getCatalog, getMeta, getPosterSvg, getStreams };

export async function handleRequest(request, response, { addon = defaultAddon } = {}) {
  const url = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);

  if (request.method === "OPTIONS") {
    sendResponse(response, 204);
    return;
  }

  if (request.method !== "GET") {
    sendError(response, 405, "Method not allowed", {
      headers: { allow: "GET, OPTIONS" }
    });
    return;
  }

  if (await handleAddonRoute(response, url.pathname, addon)) {
    return;
  }

  await sendPublicFile(response, url.pathname);
}

async function handleAddonRoute(response, pathname, addon) {
  if (pathname === "/manifest.json") {
    sendJson(response, 200, manifest);
    return true;
  }

  const posterMatch = pathname.match(/^\/poster\/(.+)\.svg$/);
  if (posterMatch) {
    const svg = await addon.getPosterSvg(decodePathSegment(posterMatch[1]));
    if (svg) {
      sendResponse(response, 200, svg, {
        cacheMaxAge: 60,
        contentType: "image/svg+xml; charset=utf-8"
      });
    } else {
      sendError(response, 404, "Poster not found");
    }
    return true;
  }

  const catalogMatch = pathname.match(/^\/catalog\/([^/]+)\/([^/]+)(?:\/(.+))?\.json$/);
  if (catalogMatch) {
    const [, type, id, extraProps] = catalogMatch;
    sendJson(
      response,
      200,
      await addon.getCatalog(decodePathSegment(type), decodePathSegment(id), parseExtraProps(extraProps))
    );
    return true;
  }

  const metaMatch = pathname.match(/^\/meta\/([^/]+)\/([^/.]+)\.json$/);
  if (metaMatch) {
    const [, type, id] = metaMatch;
    sendJson(response, 200, await addon.getMeta(decodePathSegment(type), decodePathSegment(id)));
    return true;
  }

  const streamMatch = pathname.match(/^\/stream\/([^/]+)\/([^/.]+)\.json$/);
  if (streamMatch) {
    const [, type, id] = streamMatch;
    sendJson(response, 200, await addon.getStreams(decodePathSegment(type), decodePathSegment(id)));
    return true;
  }

  return false;
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
