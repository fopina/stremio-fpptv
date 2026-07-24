import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

import { parseEventsFromHtml, parseLiveEventBlock, parseVodEventsFromHtml } from "../src/fpp/parser.js";

const source = {
  key: "recent",
  name: "Top",
  genre: "Top",
  path: "/"
};

test("parses representative VOD grid item blocks", async () => {
  const html = await readFile(new URL("./fixtures/vod-griditem.html", import.meta.url), "utf8");
  const events = parseVodEventsFromHtml(html, source);

  assert.equal(events.length, 1);
  assert.deepEqual(events[0], {
    id: "fpptv:event:recent:e-1234",
    type: "channel",
    sourceName: "Top",
    sourceGenre: "Top",
    title: "Benfica & Porto <Final>",
    duration: "01:23:45",
    details: "Campeonato Placard",
    dateText: "2026-07-24",
    poster: "https://tv.fpp.pt/images/thumbs/event-1234.jpg",
    streamUrl: "https://progressive.enetres.net/getMedia.php?asset=event-1234.mp4",
    detailUrl: "https://tv.fpp.pt/video?videoId=e-1234&playlist=recent"
  });
});

test("parses active live slider items and cleans metadata", async () => {
  const block = await readFile(new URL("./fixtures/live-slideritem.html", import.meta.url), "utf8");
  const event = parseLiveEventBlock(block, { ...source, key: "live", name: "Em Direto", genre: "Live" });

  assert.equal(event.id, "fpptv:event:live:live-live-99");
  assert.equal(event.title, "Final Four & Trophy");
  assert.equal(event.duration, "LIVE");
  assert.equal(event.details, "Pavilhao 1 | Jornada 2");
  assert.equal(event.dateText, "Hoje 21:00");
  assert.equal(event.poster, "https://tv.fpp.pt/images/live/live-99.jpg");
  assert.equal(event.detailUrl, "https://tv.fpp.pt/live?l=live-99");
  assert.equal(event.livePoint, "main");
  assert.equal(event.userId, "fpp");
});

test("live-only sources omit VOD events", async () => {
  const html = await readFile(new URL("./fixtures/vod-griditem.html", import.meta.url), "utf8");
  const events = parseEventsFromHtml(html, { ...source, liveOnly: true });

  assert.deepEqual(events, []);
});
