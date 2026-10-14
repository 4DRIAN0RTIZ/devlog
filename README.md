# devlog

Retro (2000s-style) dev log: what I'm building right now, progress per milestone and a changelog per tool. Plain HTML + vanilla JS, no build step.

It polls the public `activity` endpoint every 60 s and fetches each tool's `CHANGELOG.md` through the `changelog` endpoint (works for private repos too, only for repos carrying the `roadmap` label).

## Run

Serve the folder with any static server (ES modules need HTTP, not `file://`):

```sh
python3 -m http.server 8000
```

Use `?api=<base-url>` to point it at another functions endpoint.
