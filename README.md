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

If you change `PORT`, also set `ADDON_BASE_URL` to the URL Stremio will use to
reach this addon. For local testing it must include the same local port, such as
`ADDON_BASE_URL=http://localhost:7001` when `PORT=7001`. When testing through a
reverse tunnel, set it to the tunnel domain, such as
`ADDON_BASE_URL=https://example.trycloudflare.com`.

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

## Deployment

Deployments are handled by the GitHub Actions workflow using
[`Stremio/beamup-deploy-action`](https://github.com/Stremio/beamup-deploy-action).

The GitHub Actions deployment workflow uses one repository secret:

- `SSH_PRIVATE_KEY`: private SSH key used by Beamup for deployment, pasted
  exactly as the key file contents, without base64 or any other encoding

For GitHub Actions or other CI workflows, prefer creating a separate SSH key,
adding it to the GitHub account only long enough for the first successful
deployment, and then removing it from GitHub. Beamup caches the key after that,
so future workflow runs do not need GitHub account access. This limits the
impact of a compromised workflow to Beamup access instead of exposing the GitHub
account.
