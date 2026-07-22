# stremio-fpptv

Stremio catalog and stream addon boilerplate for `tv.fpp.pt`.

## Development

All project commands must run inside the devcontainer. Do not run `npm`, `node`,
tests, linters, formatters, or package scripts directly on the host.

From a devcontainer shell:

```sh
npm run dev
```

Then open:

```text
http://localhost:7000/
```

Stremio addon endpoints:

```text
http://localhost:7000/manifest.json
http://localhost:7000/catalog/tv/fpp-live.json
http://localhost:7000/stream/tv/fpptv:live.json
```

To force a direct playable stream while developing, set `FPP_TV_STREAM_URL`
inside the devcontainer before starting the server. Without that variable, the
stream endpoint scrapes the latest direct `tv.fpp.pt` media URL from the FPP TV
homepage. If scraping fails or no media URL is available, it falls back to an
external link to `https://tv.fpp.pt/`.

To test in stremio web, use ngrok or cloudflare tunnels to avoid browser blocking local requests:
```
cloudflared tunnel --url localhost:7000
```
