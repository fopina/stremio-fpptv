import { BASE_URL } from "../config.js";
import { normalizeFppUrl, normalizePosterUrl, normalizeVodStreamUrl } from "../url-policy.js";

export function decodeHtml(value) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", "\"")
    .replaceAll("&#039;", "'")
    .replaceAll("&apos;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&nbsp;", " ");
}

export function stripHtml(value) {
  return decodeHtml(value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim());
}

export function parseEventsFromHtml(html, source) {
  const liveEvents = parseLiveEventsFromHtml(html, source);
  if (source.liveOnly) {
    return liveEvents;
  }

  return [...liveEvents, ...parseVodEventsFromHtml(html, source)];
}

export function parseVodEventsFromHtml(html, source) {
  const blocks = html.match(
    /<div[^>]*class=["'][^"']*n3_vod_griditem[^"']*["'][\s\S]*?(?=<div[^>]*class=["'][^"']*n3_vod_griditem[^"']*["']|<script|<\/main>)/gi
  );

  if (!blocks) {
    return [];
  }

  return blocks.map((block) => parseEventBlock(block, source)).filter(Boolean);
}

export function parseLiveEventsFromHtml(html, source) {
  const blocks = html.match(
    /<li\b[^>]*class=["'][^"']*n3liveslideritem[^"']*["'][\s\S]*?<\/li>/gi
  );

  if (!blocks) {
    return [];
  }

  return blocks.map((block) => parseLiveEventBlock(block, source)).filter(Boolean);
}

export function parseEventBlock(block, source) {
  const videoHrefMatch = block.match(/href=["']([^"']*\/video\?[^"']*videoId=([^&"']+)[^"']*)["']/i);
  if (!videoHrefMatch) {
    return null;
  }

  const videoId = decodeHtml(videoHrefMatch[2]);
  const mediaMatch = block.match(
    /href=["'](https?:\/\/progressive\.enetres\.net\/+getMedia\.php\?[^"']+?\.mp4)["']/i
  );
  const imageMatch = block.match(/<img[^>]+src=["']([^"']+)["']/i);
  const titleMatch = block.match(
    /<h5[^>]*class=["'][^"']*grid-item-title[^"']*["'][^>]*>([\s\S]*?)<\/h5>/i
  );
  const durationMatch = block.match(
    /<h6[^>]*class=["'][^"']*grid-item-duration[^"']*["'][^>]*>([\s\S]*?)<\/h6>/i
  );
  const metaLines = Array.from(
    block.matchAll(/<h6[^>]*class=["'][^"']*uk-margin-remove[^"']*["'][^>]*>([\s\S]*?)<\/h6>/gi)
  )
    .map((match) => stripHtml(match[1]))
    .filter(Boolean);

  return {
    id: `fpptv:event:${source.key}:${videoId}`,
    type: "channel",
    sourceName: source.name,
    sourceGenre: source.genre,
    title: titleMatch ? stripHtml(titleMatch[1]) : `FPP TV video ${videoId}`,
    duration: durationMatch ? stripHtml(durationMatch[1]) : "",
    details: metaLines[0] || source.name,
    dateText: metaLines[1] || "",
    poster: normalizePosterUrl(imageMatch ? decodeHtml(imageMatch[1]) : "") || `${BASE_URL}/poster.svg`,
    streamUrl: normalizeVodStreamUrl(mediaMatch ? decodeHtml(mediaMatch[1]) : ""),
    detailUrl: normalizeFppUrl(decodeHtml(videoHrefMatch[1]))
  };
}

export function parseLiveEventBlock(block, source) {
  const liveHrefMatch = block.match(/href=["']([^"']*\/live\?l=([^&"']+)[^"']*)["']/i);
  const liveId = parseAttribute(block, "data-n3liveid") || (liveHrefMatch ? decodeHtml(liveHrefMatch[2]) : "");
  const liveStatus = parseAttribute(block, "data-n3livestatus");

  if (!liveId || (liveStatus && liveStatus !== "1")) {
    return null;
  }

  const livePoint = parseAttribute(block, "n3livepoint");
  const userId = parseAttribute(block, "data-n3user");
  const imageMatch = block.match(/<img[^>]+src=["']([^"']+)["']/i);
  const titleMatch = block.match(
    /<h5[^>]*class=["'][^"']*live-slider-item-title[^"']*["'][^>]*>([\s\S]*?)<\/h5>/i
  );
  const descriptionMatch = block.match(
    /<h6[^>]*class=["'][^"']*live-slider-item-desc[^"']*["'][^>]*>([\s\S]*?)<\/h6>/i
  );
  const startDateMatch = block.match(
    /<h6[^>]*class=["'][^"']*live-slider-item-start-date[^"']*["'][^>]*>([\s\S]*?)<\/h6>/i
  );

  return {
    id: `fpptv:event:${source.key}:live-${liveId}`,
    type: "channel",
    sourceName: "Em Direto",
    sourceGenre: source.genre,
    title: titleMatch ? cleanMetaText(titleMatch[1]) : `FPP TV live ${liveId}`,
    duration: "LIVE",
    details: descriptionMatch ? cleanMetaText(descriptionMatch[1]) : source.name,
    dateText: startDateMatch ? cleanMetaText(startDateMatch[1]) : "",
    poster: normalizePosterUrl(imageMatch ? decodeHtml(imageMatch[1]) : "") || `${BASE_URL}/poster.svg`,
    streamUrl: "",
    detailUrl: normalizeFppUrl(liveHrefMatch ? decodeHtml(liveHrefMatch[1]) : `/live?l=${liveId}`),
    isLive: true,
    liveId,
    livePoint,
    userId
  };
}

function parseAttribute(block, name) {
  const match = block.match(new RegExp(`${name}=["']([^"']+)["']`, "i"));
  return match ? decodeHtml(match[1]) : "";
}

function cleanMetaText(value) {
  return stripHtml(value)
    .replace(/\s*\|\s*\|\s*/g, " | ")
    .replace(/\s*\|\s*$/g, "")
    .trim();
}
