# NEXT Radar — Final Validation Report

## 1. Final decision implemented

**A — Fail-closed prioritisation.**

Radar never substitutes BRS, momentum, engagement, volume, evidence strength or Gemini judgment for an unavailable authoritative Trend-priority result.

## 2. Final full-stack architecture

- React user interface
- Node.js server
- Google GenAI SDK boundary (`@google/genai`)
- Gemini structured-output calls
- Gemini embeddings
- Radar intelligence pipeline
- RadarContext / retrieval layer
- Ask Radar deterministic router + context resolver + grounded response composer
- In-memory prototype workspace state

## 3. Files created for final AI Studio implementation

### Client
- `client/index.html`
- `client/src/App.jsx`
- `client/src/main.jsx`
- `client/src/styles.css`

### Server
- `server/index.mjs`
- `server/pipeline.mjs`
- `server/gemini.mjs`
- `server/ask-radar.mjs`
- `server/domain/constants.mjs`
- `server/domain/utils.mjs`
- `server/domain/ingestion.mjs`
- `server/domain/dedup.mjs`
- `server/domain/dove-core.mjs`
- `server/domain/clustering.mjs`
- `server/domain/hierarchy.mjs`
- `server/domain/trend-analysis.mjs`
- `server/domain/evidence.mjs`
- `server/domain/overview.mjs`
- `server/domain/context.mjs`
- `server/domain/retrieval.mjs`

### Tests / checks
- `tests/helpers.mjs`
- `tests/full-system.test.mjs`
- `tests/contracts.test.mjs`
- `scripts/check.mjs`

### Handoff / docs / demo
- `README.md`
- `AI_STUDIO_MASTER_PROMPT.md`
- `ARCHITECTURE_AND_COHERENCY.md`
- `GOOGLE_AI_STUDIO_HANDOFF.md`
- `FINAL_VALIDATION_REPORT.md`
- `data/brand_memory.json`
- `demo/sample_dove_vendor.csv`
- `demo/priority_snapshot_template.json`
- `demo/README.md`
- `.env.example`
- `.gitignore`
- `package.json`
- `vite.config.js`

## 4. Frozen-core verification

The final AI Studio implementation is a port/assembly around the accepted architecture. It does not introduce a competing scoring model.

```text
Dove profile logic/specification:          PRESERVED
Semantic matching mechanism:               PRESERVED
Cosine-similarity calculation:             PRESERVED
Unknown threshold handling:                FAIL-CLOSED; NOT GUESSED
12-dimension BRS specification:             PRESERVED
BRS UNKNOWN/provisional behavior:           PRESERVED
Negative-fit conflict behavior:             PRESERVED
Trend-level BRS aggregation:                NOT INTRODUCED
Actionability reconstruction at Trend level: NOT INTRODUCED
Final prioritisation choice:                A / FAIL-CLOSED
Evidence roles / contradiction handling:    PRESERVED
Source URL rule:                            PRESERVED
```

The original Python cumulative-v11 business logic is also retained unchanged in the final cumulative package; the AI Studio implementation lives in a separate folder.

## 5. Ask Radar capabilities

Functional architecture supports:
- active Trend/Event/Record context
- stable-ID context resolution
- follow-up references such as `the second one`
- relevance/importance explanation
- existing BRS retrieval/explanation when available
- existing actionability/priority explanation when available
- explicit fail-closed answer when actionability/priority is unavailable
- supporting evidence
- contradicting evidence
- evidence strength
- Trend/momentum analysis
- creator analysis
- missing-data explanation
- related entities
- grounded comparison
- actual source links
- structured provenance alongside answer text

## 6. Whole-system coherency checks

The final dependency-free integration test traverses:

```text
CSV/JSON
→ mapping
→ normalization
→ dedup
→ Dove matching/BRS boundary
→ candidate clustering
→ Cluster Analyst
→ hierarchy
→ Trend Analysis
→ evidence layer
→ fail-closed Overview
→ RadarContext
→ Ask Radar
→ follow-up entity resolution
→ original source
```

Explicit regression checks include:
- null remains null
- vendor prompt-like text cannot become an application instruction
- missing Dove threshold does not produce a fabricated BRS
- no Trend-level BRS aggregation
- no inferred priority under Choice A
- incomplete/unknown priority snapshots are rejected
- original source URLs are preserved
- missing source URLs are not fabricated
- unknown entity references fail gracefully
- retrieval returns defensive copies
- client code does not reference `GEMINI_API_KEY`
- authoritative ranking, when supplied, follows rank only

## 7. Compatibility review fixes found during final assembly

1. Schema mapping conflict handling was tightened so one vendor field cannot win multiple canonical meanings.
2. Dedup lineage uses exact record-ID membership rather than substring matching.
3. `existing_actionability.status = NOT_RECONSTRUCTED` is treated as unavailable rather than accidentally becoming an actionable value.
4. Ask Radar evidence retrieval variable wiring was corrected.
5. Follow-up ordering now stores returned evidence record IDs so `the second one` resolves correctly.
6. Entity-ID parsing accepts stable IDs containing underscores and fails gracefully on unknown IDs.
7. `Open the second one` routes to source retrieval.
8. Gemini 3.7 compatibility review removed explicit low-temperature generation configuration; current Gemini 3.7 guidance advises using default sampling for Gemini 3.x.
9. `@google/genai` dependency was updated to a current 2.x SDK line for the final handoff.

## 8. Validation results

### Python reference/cumulative architecture
- Unit/integration tests: **172 passed / 172 total**

### Final Node/AI Studio implementation
- Dependency-free Node tests: **14 passed / 14 total**
- Server/test `.mjs` syntax checks: PASS
- Required-project-file checks: PASS
- JSX parse checks: PASS
- Full coherency test: PASS
- Secret scan of client source: PASS

### Final rerun
- `node scripts/check.mjs`: **PASS** (19 server/test modules syntax-checked; required files present)
- `node --test tests/*.test.mjs`: **14 passed / 14 total**
- React JSX parser check: **PASS** (`App.jsx`, `main.jsx`)
- Client secret scan: **PASS**
- External web/social collection-path scan: **PASS**
- Python reference suite: **172 passed / 172 total**

## 9. Validation limits

The execution environment used to assemble this artifact does not have outbound npm registry access reliable enough to install the project dependencies. Therefore the following are **not falsely claimed as run locally**:
- `npm install`
- actual Vite production bundle using installed npm dependencies
- live Gemini API request with a real `GEMINI_API_KEY`

The code was instead validated through dependency-free Node tests, syntax parsing, JSX parsing, static secret checks and the existing Python reference suite. Google AI Studio's full-stack runtime is the intended environment for the live Gemini/npm execution.

## 10. Known intentional unavailable states

- Exact accepted Dove cosine threshold was not present in the supplied implementation. Leave `RADAR_DOVE_SIMILARITY_THRESHOLD` unset until the accepted value is known.
- Trend prioritisation is unavailable unless a complete authoritative priority snapshot is supplied.
- No external social/web search fills evidence gaps.
- Prototype server state is in memory; restart clears workspaces/chat sessions.

## 11. Demo questions

From an open Trend:

```text
Why does this matter for Dove?
Show me the evidence.
Open the second one.
What contradicts this?
How strong is the evidence?
Who is driving this?
What data are we missing?
Why is this actionable?
```

The final question should explicitly return an unavailable/fail-closed answer when authoritative actionability/prioritisation is absent.
