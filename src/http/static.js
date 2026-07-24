import { readFile, stat } from "node:fs/promises";
import { extname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

import { sendError, sendResponse } from "./respond.js";

const rootDir = join(fileURLToPath(new URL("../..", import.meta.url)));
export const publicDir = join(rootDir, "public");

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".svg": "image/svg+xml; charset=utf-8"
};

export async function sendPublicFile(response, pathname) {
  const filePath = resolvePublicPath(pathname);
  if (!filePath) {
    sendError(response, 404, "Not found");
    return;
  }

  const contentType = contentTypes[extname(filePath)] || "text/plain; charset=utf-8";

  try {
    const fileStat = await stat(filePath);
    if (!fileStat.isFile()) {
      sendError(response, 404, "Not found");
      return;
    }

    const body = await readFile(filePath, "utf8");
    sendResponse(response, 200, body, { contentType });
  } catch {
    sendError(response, 404, "Not found");
  }
}

export function resolvePublicPath(pathname, publicRoot = publicDir) {
  const fileName = pathname === "/" ? "index.html" : decodePathname(pathname).replace(/^\/+/, "");
  if (!fileName || fileName.includes("\0")) {
    return null;
  }

  const root = resolve(publicRoot);
  const filePath = resolve(root, fileName);
  const rootPrefix = root.endsWith(sep) ? root : `${root}${sep}`;

  if (!filePath.startsWith(rootPrefix) || !contentTypes[extname(filePath)]) {
    return null;
  }

  return filePath;
}

function decodePathname(pathname) {
  try {
    return decodeURIComponent(pathname);
  } catch {
    return "";
  }
}
