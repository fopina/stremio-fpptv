import { FPP_TV_FETCH_HEADERS, FPP_TV_FETCH_TIMEOUT_MS } from "../config.js";

export async function fetchHtml(url) {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(FPP_TV_FETCH_TIMEOUT_MS),
    headers: FPP_TV_FETCH_HEADERS
  });

  if (!response.ok) {
    throw new Error(`FPP TV returned ${response.status} for ${url}`);
  }

  return response.text();
}

export async function fetchJson(url, headers = {}) {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(FPP_TV_FETCH_TIMEOUT_MS),
    headers: {
      ...FPP_TV_FETCH_HEADERS,
      accept: "application/json,text/plain,*/*",
      ...headers
    }
  });

  if (!response.ok) {
    throw new Error(`FPP TV returned ${response.status} for ${url}`);
  }

  return response.json();
}
