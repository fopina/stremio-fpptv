import assert from "node:assert/strict";
import { test } from "node:test";

import {
  normalizeFppUrl,
  normalizeLiveStreamUrl,
  normalizePosterUrl,
  normalizeVodStreamUrl
} from "../src/url-policy.js";

test("allows expected poster, detail, and stream URL hosts", () => {
  assert.equal(normalizeFppUrl("/video?videoId=e-1"), "https://tv.fpp.pt/video?videoId=e-1");
  assert.equal(normalizePosterUrl("https://tv.fpp.pt/thumb.jpg"), "https://tv.fpp.pt/thumb.jpg");
  assert.equal(
    normalizeVodStreamUrl("https://progressive.enetres.net/getMedia.php?asset=one.mp4"),
    "https://progressive.enetres.net/getMedia.php?asset=one.mp4"
  );
  assert.equal(
    normalizeLiveStreamUrl("https://cdn.enetres.net/live/channel.m3u8"),
    "https://cdn.enetres.net/live/channel.m3u8"
  );
});

test("rejects unsupported URL schemes and untrusted hosts", () => {
  assert.equal(normalizeFppUrl("https://example.com/video?videoId=e-1"), "");
  assert.equal(normalizePosterUrl("javascript:alert(1)"), "");
  assert.equal(normalizeVodStreamUrl("https://example.com/video.mp4"), "");
  assert.equal(normalizeLiveStreamUrl("file:///tmp/channel.m3u8"), "");
});
