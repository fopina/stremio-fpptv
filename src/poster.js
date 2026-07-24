export function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&apos;");
}

export function wrapText(value, maxLineLength, maxLines) {
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

export function renderPosterSvg(event) {
  const titleLines = wrapText(event.title, 24, 5);
  const bottomLines = [event.dateText, event.sourceGenre].filter(Boolean);
  const liveBadge = event.isLive
    ? `
  <rect x="754" y="86" width="174" height="58" rx="6" fill="#ff0000" />
  <text x="841" y="124" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="30" font-weight="800" text-anchor="middle">LIVE</text>`
    : "";
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
  ${liveBadge}
  <text fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="62" font-weight="800">${titleTspans}</text>
  <text fill="#f0f0f0" font-family="Arial, Helvetica, sans-serif" font-size="48" font-weight="700">${bottomTspans}</text>
</svg>`;
}
