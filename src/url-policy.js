import { ENETRES_PLAYER_URL, FPP_TV_URL } from "./config.js";

const FPP_TV_HOST = new URL(FPP_TV_URL).hostname;
const ENETRES_PLAYER_HOST = new URL(ENETRES_PLAYER_URL).hostname;
const PROGRESSIVE_ENETRES_HOST = "progressive.enetres.net";
const ENETRES_ROOT_HOST = "enetres.net";

export function normalizeFppUrl(value) {
  return normalizeUrlToAllowedHosts(value, FPP_TV_URL, [FPP_TV_HOST]);
}

export function normalizePosterUrl(value) {
  return normalizeUrlToAllowedHosts(value, FPP_TV_URL, [
    FPP_TV_HOST,
    ENETRES_PLAYER_HOST,
    PROGRESSIVE_ENETRES_HOST,
    ENETRES_ROOT_HOST
  ]);
}

export function normalizeVodStreamUrl(value) {
  return normalizeUrlToAllowedHosts(value, FPP_TV_URL, [PROGRESSIVE_ENETRES_HOST]);
}

export function normalizeLiveStreamUrl(value) {
  return normalizeUrlToAllowedHosts(value, ENETRES_PLAYER_URL, [
    ENETRES_PLAYER_HOST,
    PROGRESSIVE_ENETRES_HOST,
    ENETRES_ROOT_HOST
  ]);
}

function normalizeUrlToAllowedHosts(value, baseUrl, allowedHosts) {
  if (!value) {
    return "";
  }

  let url;
  try {
    url = new URL(value, baseUrl);
  } catch {
    return "";
  }

  if (!["http:", "https:"].includes(url.protocol)) {
    return "";
  }

  return isAllowedHost(url.hostname, allowedHosts) ? url.toString() : "";
}

function isAllowedHost(hostname, allowedHosts) {
  return allowedHosts.some(
    (allowedHost) => hostname === allowedHost || hostname.endsWith(`.${allowedHost}`)
  );
}
