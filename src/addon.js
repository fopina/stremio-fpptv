import { BASE_URL, FPP_TV_VIDEO_LIST_CACHE_TTL_MS } from "./config.js";
import { SOURCE_BY_GENRE, SOURCE_BY_KEY } from "./sources.js";
import { fppScraper } from "./fpp/scraper.js";
import { renderPosterSvg } from "./poster.js";

const CATALOG_CACHE_MAX_AGE = Math.floor(FPP_TV_VIDEO_LIST_CACHE_TTL_MS / 1000);

export function createAddon({ scraper = fppScraper, baseUrl = BASE_URL } = {}) {
  async function getCatalog(type, id, extra = {}) {
    if (type !== "channel" || id !== "fpp-tv") {
      return { metas: [] };
    }

    const source = SOURCE_BY_GENRE.get(extra.genre) || SOURCE_BY_KEY.get("recent");
    const events = await scraper.scrapeSourceEvents(source);

    return {
      metas: events.map((event) => eventToMeta(event, baseUrl)),
      cacheMaxAge: CATALOG_CACHE_MAX_AGE
    };
  }

  async function getMeta(type, id) {
    if (type !== "channel") {
      return { meta: null };
    }

    const event = await scraper.findEventById(id);
    return { meta: event ? eventToMeta(event, baseUrl) : null };
  }

  async function getStreams(type, id) {
    if (type !== "channel") {
      return { streams: [] };
    }

    const event = await scraper.findEventById(id);
    if (!event) {
      return { streams: [] };
    }

    const streamEvent = await scraper.resolveEventStream(event);

    return {
      streams: [eventToStream(streamEvent)],
      cacheMaxAge: CATALOG_CACHE_MAX_AGE
    };
  }

  async function getPosterSvg(id) {
    const event = await scraper.findEventById(id);
    if (!event) {
      return null;
    }

    return renderPosterSvg(event);
  }

  return { getCatalog, getMeta, getStreams, getPosterSvg };
}

export function eventToMeta(event, baseUrl = BASE_URL) {
  return {
    id: event.id,
    type: "channel",
    name: event.title,
    poster: `${baseUrl}/poster/${encodeURIComponent(event.id)}.svg`,
    posterShape: "poster",
    background: event.poster,
    description: [event.details, event.dateText, event.duration].filter(Boolean).join("\n"),
    genres: [event.sourceGenre]
  };
}

export function eventToStream(event) {
  const title = [event.title, event.details, event.dateText, event.duration]
    .filter(Boolean)
    .join(" | ");

  if (event.streamUrl) {
    return {
      name: event.sourceName,
      title,
      url: event.streamUrl
    };
  }

  return {
    name: event.sourceName,
    title,
    externalUrl: event.detailUrl
  };
}

const addon = createAddon();

export const getCatalog = addon.getCatalog;
export const getMeta = addon.getMeta;
export const getStreams = addon.getStreams;
export const getPosterSvg = addon.getPosterSvg;
