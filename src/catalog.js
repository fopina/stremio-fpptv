const BASE_URL = process.env.ADDON_BASE_URL || "http://localhost:7000";
const FPP_TV_URL = "https://tv.fpp.pt/";
const FPP_TV_VIDEO_LIST_CACHE_TTL_MS = 60 * 1000;
const FPP_TV_FETCH_TIMEOUT_MS = 10 * 1000;

const FPP_TV_FETCH_HEADERS = {
  accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "accept-language": "pt-PT,pt;q=0.9,en;q=0.8",
  "user-agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36"
};

const HOCKEY_COMPETITIONS = [
  { key: "placard", name: "Campeonato Placard", path: "/hp/placard" },
  {
    key: "hockey-feminino",
    name: "Campeonato Nacional Feminino",
    path: "/hp/campeonato-nacional-feminino"
  },
  { key: "hockey-2d", name: "Campeonato Nacional 2ª Divisão", path: "/hp/2da-divisao" },
  { key: "hockey-3d", name: "Campeonato Nacional 3ª Divisão", path: "/hp/3a-divisao" },
  { key: "taca-portugal", name: "Taça de Portugal", path: "/hp/taca-portugal" },
  { key: "super-tacas", name: "Super Taças", path: "/hp/super-tacas" },
  { key: "sub13", name: "Campeonato Nacional Sub 13 Masculino", path: "/hp/cnsub13" },
  { key: "sub15", name: "Campeonato Nacional Sub 15 Masculino", path: "/hp/cnsub15" },
  { key: "sub17", name: "Campeonato Nacional Sub 17 Masculino", path: "/hp/cnsub17" },
  { key: "sub19", name: "Campeonato Nacional Sub 19 Masculino", path: "/hp/cnsub19" },
  { key: "sub19-fem", name: "Campeonato Nacional Sub 19 Feminino", path: "/hp/cnsub19-fem" },
  { key: "sub23", name: "Campeonato Nacional Sub 23", path: "/hp/cnsub23" },
  { key: "elite-cup", name: "Elite Cup", path: "/hp/elite-cup" },
  { key: "inter-regioes", name: "Inter-Regiões", path: "/hp/ir" },
  { key: "taca-nacoes", name: "Taça das Nações", path: "/hp/taca-nacoes" },
  { key: "goldencat-m", name: "GoldenCat Masculina", path: "/hp/goldencat-masculina" },
  { key: "goldencat-f", name: "GoldenCat Feminino", path: "/hp/goldencat-feminina" },
  { key: "u23-wse-men", name: "U23 WSE Euro Men", path: "/hp/u23-wse-euro-men" },
  { key: "u19-wse-men", name: "U19 WSE Euro Men", path: "/hp/u19-wse-euro-men" },
  { key: "u17-wse-men", name: "U17 WSE Euro Men", path: "/hp/u17-wse-euro-men" },
  { key: "u17-wse-women", name: "U17 WSE Euro Women", path: "/hp/u17-wse-euro-women" }
];

const SPORT_GENRES = [
  "Hoquei em Patins",
  ...HOCKEY_COMPETITIONS.map((competition) => `Hoquei em Patins - ${competition.name}`),
  "Patinagem Artistica",
  "Patinagem de Velocidade",
  "Skateboarding"
];

const SOURCES = [
  {
    key: "recent",
    name: "Top",
    path: "/",
    genre: "Top",
    description: "Recent FPP TV videos."
  },
  {
    key: "hockey",
    name: "Hoquei em Patins",
    path: "/hp",
    genre: "Hoquei em Patins",
    description: "Recent Hoquei em Patins videos."
  },
  {
    key: "artistic",
    name: "Patinagem Artistica",
    path: "/pa",
    genre: "Patinagem Artistica",
    description: "Recent Patinagem Artistica videos."
  },
  {
    key: "speed",
    name: "Patinagem de Velocidade",
    path: "/pv",
    genre: "Patinagem de Velocidade",
    description: "Recent Patinagem de Velocidade videos."
  },
  {
    key: "skate",
    name: "Skateboarding",
    path: "/sk",
    genre: "Skateboarding",
    description: "Recent Skateboarding videos."
  },
  ...HOCKEY_COMPETITIONS.map((competition) => ({
    ...competition,
    genre: `Hoquei em Patins - ${competition.name}`,
    description: `Recent ${competition.name} videos.`
  }))
];

const SOURCE_BY_KEY = new Map(SOURCES.map((source) => [source.key, source]));
const SOURCE_BY_GENRE = new Map(SOURCES.map((source) => [source.genre, source]));
const catalogPageCache = new Map();
const eventCache = new Map();

export const ADDON_PORT = Number.parseInt(process.env.PORT || "7000", 10);

export const manifest = {
  id: "pt.fpp.tv",
  version: "0.1.1",
  name: "FPP TV",
  description: "Catalog and stream addon for tv.fpp.pt.",
  logo: `${BASE_URL}/logo.svg`,
  resources: ["catalog", "meta", "stream"],
  types: ["channel"],
  idPrefixes: ["fpptv:"],
  catalogs: [
    {
      type: "channel",
      id: "fpp-tv",
      name: "FPP TV",
      extra: [{ name: "genre", isRequired: false, options: SPORT_GENRES }]
    }
  ]
};

export async function getCatalog(type, id, extra = {}) {
  if (type !== "channel" || id !== "fpp-tv") {
    return { metas: [] };
  }

  const source = SOURCE_BY_GENRE.get(extra.genre) || SOURCE_BY_KEY.get("recent");
  const events = await scrapeSourceEvents(source).catch(() => []);

  return {
    metas: events.map(eventToMeta),
    cacheMaxAge: Math.floor(FPP_TV_VIDEO_LIST_CACHE_TTL_MS / 1000)
  };
}

export async function getMeta(type, id) {
  if (type !== "channel") {
    return { meta: null };
  }

  const event = await findEventById(id);
  return { meta: event ? eventToMeta(event) : null };
}

export async function getStreams(type, id) {
  if (type !== "channel") {
    return { streams: [] };
  }

  const event = await findEventById(id);
  if (!event) {
    return { streams: [] };
  }

  return {
    streams: [eventToStream(event)],
    cacheMaxAge: Math.floor(FPP_TV_VIDEO_LIST_CACHE_TTL_MS / 1000)
  };
}

export async function getPosterSvg(id) {
  const event = await findEventById(id);
  if (!event) {
    return null;
  }

  return renderPosterSvg(event);
}

function decodeHtml(value) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", "\"")
    .replaceAll("&#039;", "'")
    .replaceAll("&apos;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&nbsp;", " ");
}

function stripHtml(value) {
  return decodeHtml(value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim());
}

function normalizeUrl(value) {
  return new URL(decodeHtml(value), FPP_TV_URL).toString();
}

async function fetchHtml(url) {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(FPP_TV_FETCH_TIMEOUT_MS),
    headers: FPP_TV_FETCH_HEADERS
  });

  if (!response.ok) {
    throw new Error(`FPP TV returned ${response.status} for ${url}`);
  }

  return response.text();
}

async function scrapeSourceEvents(source) {
  const url = new URL(source.path, FPP_TV_URL).toString();
  const now = Date.now();
  const cached = catalogPageCache.get(url);

  if (cached && now - cached.fetchedAt < FPP_TV_VIDEO_LIST_CACHE_TTL_MS) {
    return cached.events;
  }

  const events = parseEventsFromHtml(await fetchHtml(url), source);
  catalogPageCache.set(url, { fetchedAt: now, events });

  for (const event of events) {
    eventCache.set(event.id, { fetchedAt: now, event });
  }

  return events;
}

function parseEventsFromHtml(html, source) {
  const blocks = html.match(
    /<div[^>]*class=["'][^"']*n3_vod_griditem[^"']*["'][\s\S]*?(?=<div[^>]*class=["'][^"']*n3_vod_griditem[^"']*["']|<script|<\/main>)/gi
  );

  if (!blocks) {
    return [];
  }

  return blocks.map((block) => parseEventBlock(block, source)).filter(Boolean);
}

function parseEventBlock(block, source) {
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
    poster: imageMatch ? normalizeUrl(imageMatch[1]) : `${BASE_URL}/poster.svg`,
    streamUrl: mediaMatch ? normalizeUrl(mediaMatch[1]) : "",
    detailUrl: normalizeUrl(videoHrefMatch[1])
  };
}

function eventToMeta(event) {
  return {
    id: event.id,
    type: "channel",
    name: event.title,
    poster: `${BASE_URL}/poster/${encodeURIComponent(event.id)}.svg`,
    posterShape: "poster",
    background: event.poster,
    description: [event.details, event.dateText, event.duration].filter(Boolean).join("\n"),
    genres: [event.sourceGenre]
  };
}

function eventToStream(event) {
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

function parseEventId(id) {
  const match = id.match(/^fpptv:event:([^:]+):([^:]+)$/);
  if (!match) {
    return null;
  }

  return {
    sourceKey: match[1],
    videoId: match[2]
  };
}

async function findEventById(id) {
  const now = Date.now();
  const cached = eventCache.get(id);
  if (cached && now - cached.fetchedAt < FPP_TV_VIDEO_LIST_CACHE_TTL_MS) {
    return cached.event;
  }

  const parsed = parseEventId(id);
  const source = parsed ? SOURCE_BY_KEY.get(parsed.sourceKey) : null;
  if (!source) {
    return null;
  }

  const events = await scrapeSourceEvents(source).catch(() => []);
  return events.find((event) => event.id === id) || null;
}

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&apos;");
}

function wrapText(value, maxLineLength, maxLines) {
  const words = String(value || "").split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";

  for (const word of words) {
    const nextLine = line ? `${line} ${word}` : word;
    if (nextLine.length > maxLineLength && line) {
      lines.push(line);
      line = word;
    } else {
      line = nextLine;
    }

    if (lines.length === maxLines) {
      break;
    }
  }

  if (line && lines.length < maxLines) {
    lines.push(line);
  }

  if (words.join(" ").length > lines.join(" ").length && lines.length) {
    lines[lines.length - 1] = `${lines[lines.length - 1].replace(/\s+$/, "")}...`;
  }

  return lines;
}

function renderPosterSvg(event) {
  const titleLines = wrapText(event.title, 24, 5);
  const bottomLines = [event.dateText, event.sourceGenre].filter(Boolean);
  const titleTspans = titleLines
    .map((line, index) => `<tspan x="72" y="${670 + index * 76}">${escapeXml(line)}</tspan>`)
    .join("");
  const bottomTspans = bottomLines
    .map((line, index) => `<tspan x="72" y="${1286 + index * 58}">${escapeXml(line)}</tspan>`)
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1500" viewBox="0 0 1000 1500">
  <rect width="1000" height="1500" fill="#1e1e1e" />
  <linearGradient id="shade" x1="0" x2="0" y1="0" y2="1">
    <stop offset="0" stop-color="#2c2c2c" />
    <stop offset="0.45" stop-color="#111111" />
    <stop offset="1" stop-color="#a42227" />
  </linearGradient>
  <rect width="1000" height="1500" fill="url(#shade)" />
  <rect x="72" y="86" width="172" height="58" rx="6" fill="#a42227" />
  <text x="158" y="124" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="30" font-weight="700" text-anchor="middle">FPP TV</text>
  <text fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="62" font-weight="800">${titleTspans}</text>
  <text fill="#f0f0f0" font-family="Arial, Helvetica, sans-serif" font-size="48" font-weight="700">${bottomTspans}</text>
</svg>`;
}
