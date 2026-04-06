# Sorted — Website comparison + prompt generator

Internal local tool: compare a **current** URL with a **new** URL using desktop and mobile screenshots, structured text/structure/visual heuristics, and a generated update prompt.

## Requirements

- **Node.js** 20+
- **Chromium** for Playwright (installed automatically via `postinstall`, or run `npx playwright install chromium`)

## Run locally

This app uses **Playwright** to load arbitrary URLs and capture screenshots. Run it on your machine — do not deploy the capture flow to serverless hosts that cannot run a full browser.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Optional: OpenAI

Set `OPENAI_API_KEY` in `.env.local` for LLM-generated prompts. Without it, a deterministic template is used from the comparison findings.

Optional: `OPENAI_MODEL` (default `gpt-4o-mini`).

## Artifacts

Each run writes under `public/data/runs/{id}/` (gitignored): PNG screenshots and `comparison.json`.
