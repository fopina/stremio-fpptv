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
http://localhost:7000/catalog/channel/fpp-tv.json
http://localhost:7000/catalog/channel/fpp-tv/genre=Hoquei%20em%20Patins.json
http://localhost:7000/stream/channel/fpptv:event:recent:e-1234.json
```

The addon exposes one `channel` catalog named `FPP TV`. Without a genre, it
returns individual video metas from the recent videos page. Genre filters return
video metas from the selected sport or hockey championship. Selecting any meta
returns that video's single stream. Scraped video lists are cached for 60
seconds.

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
