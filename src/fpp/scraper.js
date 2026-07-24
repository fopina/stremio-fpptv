import { ENETRES_PLAYER_URL, FPP_TV_URL, FPP_TV_VIDEO_LIST_CACHE_TTL_MS } from "../config.js";
import { normalizeLiveStreamUrl, normalizePosterUrl } from "../url-policy.js";
import { SOURCE_BY_KEY } from "../sources.js";
import { fetchHtml, fetchJson } from "./client.js";
import { parseEventsFromHtml } from "./parser.js";

export function createFppScraper({
  fetchHtmlImpl = fetchHtml,
  fetchJsonImpl = fetchJson,
  now = () => Date.now(),
  ttlMs = FPP_TV_VIDEO_LIST_CACHE_TTL_MS
} = {}) {
  const catalogPageCache = new Map();
  const eventCache = new Map();
  const liveStreamCache = new Map();
  const inFlightSourceFetches = new Map();
  const inFlightLiveFetches = new Map();

  async function scrapeSourceEvents(source) {
    const url = new URL(source.path, FPP_TV_URL).toString();
    const cacheKey = `${source.key}:${url}`;
    const currentTime = now();
    const cached = catalogPageCache.get(cacheKey);

    if (cached && currentTime - cached.fetchedAt < ttlMs) {
      return cached.events;
    }

    const inFlight = inFlightSourceFetches.get(cacheKey);
    if (inFlight) {
      return inFlight;
    }

    const request = (async () => {
      const events = parseEventsFromHtml(await fetchHtmlImpl(url), source);
      const fetchedAt = now();
      catalogPageCache.set(cacheKey, { fetchedAt, events });

      for (const event of events) {
        eventCache.set(event.id, { fetchedAt, event });
      }

      return events;
    })();

    inFlightSourceFetches.set(cacheKey, request);
    try {
      return await request;
    } finally {
      inFlightSourceFetches.delete(cacheKey);
    }
  }

  async function findEventById(id) {
    const currentTime = now();
    const cached = eventCache.get(id);
    if (cached && currentTime - cached.fetchedAt < ttlMs) {
      return cached.event;
    }

    const sourceKey = parseEventId(id);
    const source = sourceKey ? SOURCE_BY_KEY.get(sourceKey) : null;
    if (!source) {
      return null;
    }

    const events = await scrapeSourceEvents(source).catch(() => []);
    return events.find((event) => event.id === id) || null;
  }

  async function fetchLiveStreamData(liveId) {
    const currentTime = now();
    const cached = liveStreamCache.get(liveId);
    if (cached && currentTime - cached.fetchedAt < ttlMs) {
      return cached.data;
    }

    const inFlight = inFlightLiveFetches.get(liveId);
    if (inFlight) {
      return inFlight;
    }

    const request = (async () => {
      const data = await fetchJsonImpl(getLiveDataUrl(liveId), {
        referer: getLivePlayerUrl(liveId)
      });
      liveStreamCache.set(liveId, { fetchedAt: now(), data });
      return data;
    })();

    inFlightLiveFetches.set(liveId, request);
    try {
      return await request;
    } finally {
      inFlightLiveFetches.delete(liveId);
    }
  }

  async function resolveEventStream(event) {
    if (!event.isLive || event.streamUrl || !event.liveId) {
      return event;
    }

    const liveData = await fetchLiveStreamData(event.liveId).catch(() => null);
    if (!liveData) {
      return event;
    }

    return {
      ...event,
      title: event.title || liveData.title,
      details: event.details || liveData.description,
      poster: normalizePosterUrl(liveData.miniature) || event.poster,
      streamUrl: getLiveStreamUrl(liveData)
    };
  }

  function clearCaches() {
    catalogPageCache.clear();
    eventCache.clear();
    liveStreamCache.clear();
    inFlightSourceFetches.clear();
    inFlightLiveFetches.clear();
  }

  return {
    scrapeSourceEvents,
    findEventById,
    fetchLiveStreamData,
    resolveEventStream,
    clearCaches
  };
}

export function parseEventId(id) {
  const match = id.match(/^fpptv:event:([^:]+):[^:]+$/);
  return match ? match[1] : null;
}

function getLiveDataUrl(liveId) {
  return new URL(`/live/${encodeURIComponent(liveId)}/json`, ENETRES_PLAYER_URL).toString();
}

function getLivePlayerUrl(liveId) {
  return new URL(`/live/${encodeURIComponent(liveId)}`, ENETRES_PLAYER_URL).toString();
}

function getLiveStreamUrl(liveData) {
  return normalizeLiveStreamUrl(
    liveData.n3CDNPlaylist ||
      liveData.iosPath ||
      liveData.cdnHLSPath ||
      liveData.cdnRTMPPath ||
      ""
  );
}

export const fppScraper = createFppScraper();
export const scrapeSourceEvents = fppScraper.scrapeSourceEvents;
export const findEventById = fppScraper.findEventById;
export const resolveEventStream = fppScraper.resolveEventStream;
