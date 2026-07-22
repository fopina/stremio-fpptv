# Repository Instructions

## Container-Only Development

- This project must be developed and verified inside the devcontainer.
- Do not run project code, tests, package scripts, dependency installers, linters, formatters, or build commands directly on the host machine.
- Use `devcontainer exec`, an attached devcontainer shell, or commands executed from inside the container for all project execution.
- Host-side commands are allowed only for passive file inspection and editing, such as `ls`, `rg`, `sed`, `git status`, and applying patches.
- If the devcontainer is unavailable, stop and ask before running any project command locally.

## Dependency Safety

- Treat the Stremio SDK and all transitive npm dependencies as untrusted until installed and inspected inside the devcontainer.
- Keep dependency caches under workspace-local cache paths configured by `.devcontainer/devcontainer.json`.
- Prefer reproducible installs from a lockfile once package metadata exists.

## Project Intent

- Build a Stremio catalog and stream addon for `tv.fpp.pt`.
- Keep addon behavior explicit and testable from inside the container.
