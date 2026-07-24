import { createRequire } from "node:module";

import { BASE_URL } from "./config.js";
import { CATALOG_GENRES } from "./sources.js";

const { version } = createRequire(import.meta.url)("../package.json");

export const manifest = {
  id: "com.skmobi.fpptv",
  version,
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
      extra: [{ name: "genre", isRequired: false, options: CATALOG_GENRES }]
    }
  ]
};
