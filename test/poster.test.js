import assert from "node:assert/strict";
import { test } from "node:test";

import { escapeXml, renderPosterSvg, wrapText } from "../src/poster.js";

test("escapes XML-sensitive characters", () => {
  assert.equal(escapeXml("A&B <C> \"D\" 'E'"), "A&amp;B &lt;C&gt; &quot;D&quot; &apos;E&apos;");
});

test("wraps long poster text and truncates overflowing lines", () => {
  assert.deepEqual(wrapText("one two three four five six", 8, 2), ["one two", "three..."]);
});

test("renders escaped poster SVG with live badge", () => {
  const svg = renderPosterSvg({
    title: "A&B <Final>",
    dateText: "Hoje",
    sourceGenre: "Live",
    isLive: true
  });

  assert.match(svg, /A&amp;B &lt;Final&gt;/);
  assert.match(svg, /LIVE/);
});
