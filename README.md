# NEXT Radar — Google AI Studio Final (Option A: Fail-Closed Prioritisation)

This is the final full-stack handoff for the HUL TechTonic NEXT Radar prototype.
It preserves the architecture built through Pieces 1–11 and implements the user's final choice **A**:

> Radar does **not** invent, reconstruct, infer, or substitute a Trend-level actionability/prioritisation score. If an authoritative priority snapshot is not supplied, Radar surfaces unranked intelligence and explicitly marks prioritisation as unavailable.

## Product boundary

Commercial vendor CSV/JSON → flexible ingestion → dedup → Dove matching/BRS where frozen configuration is available → bottom-up clustering → Cluster Analyst → Theme/Trend/Event hierarchy → Trend Analysis Pack → Evidence/Provenance → fail-closed Overview → RadarContext → Ask Radar.

Ask Radar is an investigation layer only. It retrieves and explains existing Radar state. It does not recompute BRS/actionability, fabricate links/metrics, scrape the web, forecast virality, or generate autonomous campaigns.

## Google AI Studio

Google AI Studio Build mode supports a web client plus a server-side Node.js runtime. Import this project from GitHub in Build mode. Keep Gemini calls server-side; AI Studio automatically provisions `GEMINI_API_KEY` as a server-side secret for Gemini-enabled apps.

### Import path

1. Put this folder in a GitHub repository.
2. Open Google AI Studio → **Build**.
3. Use **Add files (+) → Import from GitHub** and choose the repository.
4. Confirm the server-side `GEMINI_API_KEY` secret exists in Settings → Secrets.
5. Optional: set `RADAR_DOVE_SIMILARITY_THRESHOLD` only if you have the accepted frozen value. **Do not guess it.**
6. Run the app.

See `AI_STUDIO_MASTER_PROMPT.md` for a preservation prompt to paste after import.

## Local development

```bash
npm install
npm run dev
```

Client: `http://localhost:5173`  
Server: `http://localhost:3001`

Production-style:

```bash
npm run build
npm start
```

## Input

Upload a Dove vendor package in CSV or JSON. Optional: upload an authoritative priority snapshot JSON. Without that snapshot, the Overview is intentionally unranked.

Priority snapshot shape:

```json
{
  "dataset_id": "DATASET_...",
  "references": [
    {
      "trend_id": "TREND_...",
      "band": "HIGH PRIORITY",
      "priority_rank": 1,
      "raw_output": {"source": "existing frozen service"}
    }
  ]
}
```

Radar will not infer missing bands/ranks and requires complete Trend coverage before showing a ranked Overview.

## Important configuration rule

The supplied legacy prototype did not contain the exact accepted Dove cosine threshold. Therefore:

- if `RADAR_DOVE_SIMILARITY_THRESHOLD` is present, the matching/BRS gate can run;
- if it is absent, matching/BRS is marked unavailable/provisional instead of using a fabricated threshold.

## Tests

`npm test` runs the dependency-free server/domain coherency tests with a fake Gemini adapter. `node scripts/check.mjs` additionally syntax-checks every server/test `.mjs` file and verifies required project files.

The client production build requires npm packages and therefore cannot be truthfully validated in an offline runtime where package installation is unavailable.
