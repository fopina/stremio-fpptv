import { createServer } from "node:http";

import { ADDON_PORT } from "./config.js";
import { handleRequest } from "./http/routes.js";

const server = createServer((request, response) => {
  handleRequest(request, response).catch((error) => {
    console.error(error);
    response.writeHead(500, { "content-type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ error: "Internal server error" }));
  });
});

server.listen(ADDON_PORT, "0.0.0.0", () => {
  console.log(`FPP TV Stremio addon listening on http://localhost:${ADDON_PORT}`);
});
