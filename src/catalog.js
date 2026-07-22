const BASE_URL = process.env.ADDON_BASE_URL || "http://localhost:7000";
const STREAM_URL = process.env.FPP_TV_STREAM_URL || "";
const FPP_TV_URL = "https://tv.fpp.pt/";
const FPP_TV_CACHE_TTL_MS = 5 * 60 * 1000;

let scrapedStreamCache = {
  fetchedAt: 0,
  stream: null
};

export const ADDON_PORT = Number.parseInt(process.env.PORT || "7000", 10);

export const manifest = {
  id: "pt.fpp.tv",
  version: "0.1.0",
  name: "FPP TV",
  description: "Catalog and stream addon for tv.fpp.pt.",
  logo: `${BASE_URL}/logo.svg`,
  resources: ["catalog", "stream"],
  types: ["tv"],
  idPrefixes: ["fpptv:"],
  catalogs: [
    {
      type: "tv",
      id: "fpp-live",
      name: "FPP TV"
    }
  ]
};

export const metas = [
  {
    id: "fpptv:live",
    type: "tv",
    name: "FPP TV",
    poster: `${BASE_URL}/poster.svg`,
    background: `${BASE_URL}/background.svg`,
    description: "Latest programming from tv.fpp.pt."
  }
];

export function getCatalog(type, id) {
  if (type !== "tv" || id !== "fpp-live") {
    return { metas: [] };
  }

  return { metas };
}

function decodeHtml(value) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", "\"")
    .replaceAll("&#039;", "'")
    .replaceAll("&apos;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");
}

function stripHtml(value) {
  return decodeHtml(value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim());
}

function extractLatestStreamFromHtml(html) {
  const mediaMatch = html.match(
    /href=["'](https?:\/\/progressive\.enetres\.net\/+getMedia\.php\?[^"']+?\.mp4)["']/i
  );

  if (!mediaMatch) {
    return null;
  }

  const url = decodeHtml(mediaMatch[1]);
  const detailsHtml = html.slice(mediaMatch.index, mediaMatch.index + 2500);
  const titleMatch = detailsHtml.match(
    /<h5[^>]*class=["'][^"']*grid-item-title[^"']*["'][^>]*>([\s\S]*?)<\/h5>/i
  );
  const title = titleMatch ? stripHtml(titleMatch[1]) : "FPP TV video";

  return {
    name: "FPP TV",
    title,
    url
  };
}

async function scrapeLatestStream() {
  const now = Date.now();
  if (scrapedStreamCache.stream && now - scrapedStreamCache.fetchedAt < FPP_TV_CACHE_TTL_MS) {
    return scrapedStreamCache.stream;
  }

  const response = await fetch(FPP_TV_URL, {
    headers: {
      accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "accept-language": "pt-PT,pt;q=0.9,en;q=0.8",
      "user-agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36"
    }
  });

  if (!response.ok) {
    return null;
  }

  const stream = extractLatestStreamFromHtml(await response.text());
  scrapedStreamCache = {
    fetchedAt: now,
    stream
  };

  return stream;
}

export async function getStreams(type, id) {
  if (type !== "tv" || id !== "fpptv:live") {
    return { streams: [] };
  }

  if (STREAM_URL) {
    return {
      streams: [
        {
          name: "FPP TV",
          title: "FPP TV live stream",
          url: STREAM_URL
        }
      ]
    };
  }

  const scrapedStream = await scrapeLatestStream().catch(() => null);
  if (scrapedStream) {
    return {
      streams: [scrapedStream],
      cacheMaxAge: 300
    };
  }

  return {
    streams: [
      {
        name: "FPP TV",
        title: "Open tv.fpp.pt",
        externalUrl: "https://tv.fpp.pt/"
      }
    ]
  };
}
