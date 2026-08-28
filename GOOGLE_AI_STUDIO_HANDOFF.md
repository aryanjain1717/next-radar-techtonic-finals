# Google AI Studio Handoff

## Purpose

This folder is the final full-stack NEXT Radar implementation for Google AI Studio Build mode. The user-facing app is Dove-only and includes Ask Radar as a grounded investigation layer.

## Import into Google AI Studio

1. Put the contents of this folder into a GitHub repository.
2. Open **Google AI Studio → Build**.
3. Choose **Add files (+) → Import from GitHub** and select the repository.
4. Let AI Studio load the React client and Node.js server.
5. Open **Settings → Secrets** and verify `GEMINI_API_KEY` is available server-side.
6. Do **not** place the key in `client/`, Vite environment variables intended for the browser, or committed source.
7. If and only if the accepted Dove cosine threshold is known, add `RADAR_DOVE_SIMILARITY_THRESHOLD` as a server-side environment value. Otherwise leave it absent; the application intentionally fails closed for matching/BRS.
8. Paste `AI_STUDIO_MASTER_PROMPT.md` into Build chat before asking the agent to modify the imported project.
9. Run the application and upload `demo/sample_dove_vendor.csv` for a smoke test.

## Final Choice A

The application intentionally does **not** derive Trend priority.

Without an authoritative priority snapshot:
- Overview shows unranked Trends.
- No executive ranking is shown.
- Ask Radar will not call a Trend actionable or prioritized merely from BRS, momentum, engagement or evidence strength.

If an authoritative snapshot becomes available, use the optional JSON upload or the `/api/datasets/:datasetId/prioritization` endpoint. The snapshot must cover every active Trend exactly once and supply unique ranks.

See `demo/priority_snapshot_template.json` for the structure. Its placeholder IDs are not demo scores and cannot be applied as-is.

## Useful server environment variables

```text
GEMINI_API_KEY                       required for live Gemini calls
RADAR_GEMINI_MODEL                  optional; default gemini-3.7-flash
RADAR_EMBEDDING_MODEL               optional; default gemini-embedding-2
RADAR_DOVE_SIMILARITY_THRESHOLD     optional only if accepted frozen value is known
RADAR_DISCOVERY_SIMILARITY_THRESHOLD optional; default 0.72
RADAR_DISCOVERY_TOP_K               optional; default 8
RADAR_DISCOVERY_MIN_CLUSTER_SIZE    optional; default 2
RADAR_DISCOVERY_EMBEDDING_DIMENSION optional; default 128
PORT                                 optional; default 3001
```

## Local run

```bash
npm install
npm run dev
```

Production-style:

```bash
npm run build
npm start
```

The Node server serves `dist-client/` after the Vite build.

## Smoke-test flow

1. Upload `demo/sample_dove_vendor.csv`.
2. Confirm Overview says **Prioritisation unavailable — by design**.
3. Open Intelligence and inspect Theme → Trend → Event.
4. Open a Trend and inspect analysis + evidence roles.
5. Open a record and verify its original source link.
6. Open Ask Radar from the Trend and ask:
   - `Why does this matter for Dove?`
   - `Show me the evidence.`
   - `Open the second one.`
   - `What contradicts this?`
   - `What data are we missing?`
   - `Why is this actionable?`
7. The last question must fail closed unless an authoritative actionability/priority result exists.

## Important AI Studio preservation instruction

Do not let an AI Studio agent “improve” missing priority by inventing a ranking. The absence of priority is an intentional product behavior, not an unfinished TODO.

## Current official references checked during handoff

- Google AI Studio Build mode: https://ai.google.dev/gemini-api/docs/aistudio-build-mode
- Full-stack runtime: https://ai.google.dev/gemini-api/docs/aistudio-fullstack
- Gemini 3.7 Flash: https://ai.google.dev/gemini-api/docs/models/gemini-3.7-flash
- Structured outputs: https://ai.google.dev/gemini-api/docs/structured-output
- Embeddings / `gemini-embedding-2`: https://ai.google.dev/gemini-api/docs/embeddings
