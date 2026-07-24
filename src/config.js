export const BASE_URL = process.env.ADDON_BASE_URL || "http://localhost:7000";
export const ADDON_PORT = parsePort(process.env.PORT, 7000);
export const FPP_TV_URL = "https://tv.fpp.pt/";
export const ENETRES_PLAYER_URL = "https://players.cdn.enetres.net/";
export const FPP_TV_VIDEO_LIST_CACHE_TTL_MS = 60 * 1000;
export const FPP_TV_FETCH_TIMEOUT_MS = 10 * 1000;

export const FPP_TV_FETCH_HEADERS = {
  accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "accept-language": "pt-PT,pt;q=0.9,en;q=0.8",
  "user-agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36"
};

function parsePort(value, fallback) {
  if (!value) {
    return fallback;
  }

  const port = Number.parseInt(value, 10);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid PORT value: ${value}`);
  }

  return port;
}
