import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

import { createFppScraper, parseEventId } from "../src/fpp/scraper.js";
import { SOURCE_BY_KEY } from "../src/sources.js";

test("parseEventId returns only the source key", () => {
  assert.equal(parseEventId("fpptv:event:recent:e-1234"), "recent");
  assert.equal(parseEventId("not-an-event"), null);
});

test("deduplicates in-flight source scrapes", async () => {
  const html = await readFile(new URL("./fixtures/vod-griditem.html", import.meta.url), "utf8");
  let fetchCalls = 0;
  let resolveFetch;
  const fetchPromise = new Promise((resolve) => {
    resolveFetch = resolve;
  });
  const scraper = createFppScraper({
    fetchHtmlImpl: async () => {
      fetchCalls += 1;
      return fetchPromise;
    }
  });

  const first = scraper.scrapeSourceEvents(SOURCE_BY_KEY.get("recent"));
  const second = scraper.scrapeSourceEvents(SOURCE_BY_KEY.get("recent"));
  resolveFetch(html);

  const [firstEvents, secondEvents] = await Promise.all([first, second]);
  assert.equal(fetchCalls, 1);
  assert.equal(firstEvents.length, 1);
  assert.equal(secondEvents.length, 1);
});

test("uses cached source events until the TTL expires", async () => {
  const html = await readFile(new URL("./fixtures/vod-griditem.html", import.meta.url), "utf8");
  let fetchCalls = 0;
  let currentTime = 1000;
  const scraper = createFppScraper({
    ttlMs: 100,
    now: () => currentTime,
    fetchHtmlImpl: async () => {
      fetchCalls += 1;
      return html;
    }
  });

  await scraper.scrapeSourceEvents(SOURCE_BY_KEY.get("recent"));
  currentTime += 50;
  await scraper.scrapeSourceEvents(SOURCE_BY_KEY.get("recent"));
  currentTime += 101;
  await scraper.scrapeSourceEvents(SOURCE_BY_KEY.get("recent"));

  assert.equal(fetchCalls, 2);
});

test("resolves cached events by id without a live network call", async () => {
  const html = await readFile(new URL("./fixtures/vod-griditem.html", import.meta.url), "utf8");
  let fetchCalls = 0;
  const scraper = createFppScraper({
    fetchHtmlImpl: async () => {
      fetchCalls += 1;
      return html;
    }
  });

  await scraper.scrapeSourceEvents(SOURCE_BY_KEY.get("recent"));
  const event = await scraper.findEventById("fpptv:event:recent:e-1234");

  assert.equal(fetchCalls, 1);
  assert.equal(event.title, "Benfica & Porto <Final>");
});

test("deduplicates in-flight live stream lookups and allowlists returned URLs", async () => {
  let fetchCalls = 0;
  let resolveFetch;
  const fetchPromise = new Promise((resolve) => {
    resolveFetch = resolve;
  });
  const scraper = createFppScraper({
    fetchJsonImpl: async () => {
      fetchCalls += 1;
      return fetchPromise;
    }
  });

  const first = scraper.fetchLiveStreamData("live-1");
  const second = scraper.fetchLiveStreamData("live-1");
  resolveFetch({ n3CDNPlaylist: "https://cdn.enetres.net/live/live-1.m3u8" });

  const [firstData, secondData] = await Promise.all([first, second]);
  assert.equal(fetchCalls, 1);
  assert.equal(firstData.n3CDNPlaylist, secondData.n3CDNPlaylist);

  const event = await scraper.resolveEventStream({
    id: "fpptv:event:live:live-live-1",
    type: "channel",
    sourceName: "Em Direto",
    sourceGenre: "Live",
    title: "Live",
    details: "Now",
    dateText: "",
    poster: "https://tv.fpp.pt/poster.jpg",
    streamUrl: "",
    detailUrl: "https://tv.fpp.pt/live?l=live-1",
    isLive: true,
    liveId: "live-1"
  });

  assert.equal(event.streamUrl, "https://cdn.enetres.net/live/live-1.m3u8");
});
