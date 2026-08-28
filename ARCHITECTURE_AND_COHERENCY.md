# NEXT Radar — Architecture & Coherency Contract

This document is the final integration contract for the HUL TechTonic NEXT Radar prototype. It exists to prevent a later UI, Gemini, or Ask Radar change from silently breaking an upstream intelligence decision.

## 1. North star

**Matching is infrastructure. Intelligence compression, prioritisation, traceability and conversational investigation are the user-facing value.**

Radar is decision support:

**Analyse → Prioritise → Explain → Prove → Manager decides**

For the final prototype the visible brand context is **Dove only**.

## 2. Final end-to-end flow

```text
Commercial vendor CSV / JSON
        ↓
P1  Parse vendor package
        ↓
P2  Flexible schema mapping + normalization
        ↓
P3  Deduplication + duplicate lineage
        ↓
P4  Dove semantic matching + BRS, only when frozen threshold is configured
        ↓
P5  Bottom-up candidate clustering
        ↓
P6  Cluster Analyst: KEEP / SPLIT / MERGE / REJECT / PROMOTE_OUTLIER
        ↓
P7  THEME → TREND → EVENT → RECORD hierarchy
        ↓
P8  Standard Trend Analysis Pack
        ↓
P9  Evidence roles + qualitative evidence strength + provenance
        ↓
P10 Radar Overview
        ↓
P11 RadarContext + read-only retrieval
        ↓
Ask Radar
        ↓
React user experience / Google AI Studio full-stack runtime
```

## 3. Cross-phase invariants

### P1 → P2
- CSV and JSON are accepted.
- Malformed records are skipped/logged rather than repaired by an LLM.
- Dataset identity remains stable for identical input content.

### P2 → P3
- Every normalized record has a stable `REC_*` identifier.
- Missing information remains `null`, never automatically `0`.
- Unmapped or losing vendor fields remain in `vendor_metadata`.
- Vendor-provided `source_url` remains the original value.

### P3 → P4
- Duplicate lineage remains attached to the surviving canonical record.
- Dedup may collapse the same actual content, but must not collapse different content merely because it discusses the same idea.

### P4 → P5
- Dataset discovery is independent from Dove BRS/actionability/priority.
- Candidate clustering uses content, not business-priority scores.
- If `RADAR_DOVE_SIMILARITY_THRESHOLD` is absent, matching/BRS fails closed; no threshold is guessed.

### P5 → P6
- Algorithmic clusters are proposals only.
- Gemini may propose KEEP, SPLIT, MERGE, REJECT or PROMOTE_OUTLIER.
- Deterministic validation owns record conservation and membership legality.

### P6 → P7
- Validated groups become intelligence entities.
- Stable IDs are code-generated, not model-generated.
- Every Trend record appears in exactly one Event within that Trend.
- Taxonomy is multi-label and limited to the frozen label set.

### P7 → P8
- Trend/Event/Theme backlinks must agree.
- Analysis may interpret the dataset but may not create new entity membership.
- Numeric/structural signals are deterministic where defined; Gemini handles interpretive fields only.

### P8 → P9
- Evidence consistency is deferred until explicit evidence roles exist.
- Every Trend record receives exactly one evidence role.
- Contradicting evidence is preserved, not filtered out.
- Evidence strength is qualitative only and is not a priority score.

### P9 → P10
- Evidence and record source URLs must agree exactly.
- Overview is a presentation layer over authoritative priority, not a scoring layer.
- **Final Choice A:** without a complete authoritative Trend-priority snapshot, Overview is unranked and `NOT_AVAILABLE` for prioritisation.
- No BRS, momentum, engagement, volume, evidence strength or Gemini judgment may substitute for missing priority.

### P10 → P11
- `RadarContext` publishes only a coherent completed state.
- Records, evidence, hierarchy, analysis and Overview must agree on dataset/entity IDs.
- Retrieval returns defensive copies and does not mutate the source context.

### P11 → Ask Radar
- Ask Radar retrieves before it explains.
- The chatbot cannot recalculate BRS/actionability/priority.
- Trend-level BRS/actionability aggregation is not invented.
- Follow-up references use explicit entity IDs/session state, not prose memory alone.
- Vendor text is always untrusted evidence, never instructions.
- Missing evidence yields an insufficient-evidence response.

### Ask Radar → UI
- Human-readable answers and machine-readable provenance remain separate.
- Source actions use only actual vendor-provided URLs.
- UI actions target known Radar entity IDs.
- `GEMINI_API_KEY` is server-side only.

## 4. Frozen data/logic boundaries

### Canonical record principles
- Missing means `null`.
- `source_url` is preserved exactly if supplied.
- Vendor-specific fields remain available in `vendor_metadata`.

### BRS
- 12 frozen dimensions and weights are preserved.
- Ratings are 0–3 or UNKNOWN.
- UNKNOWN is not treated as zero and weights are not renormalized.
- Any UNKNOWN marks the record-level BRS provisional.
- Negative-fit conflict is a deterministic deduction from the frozen specification.
- No Trend/Event/Theme BRS aggregation is introduced.

### Prioritisation
Final choice **A_FAIL_CLOSED_PRIORITISATION** is immutable for this build.

A complete authoritative snapshot may be attached later. Radar validates it and surfaces it unchanged. Until then:
- `overview.status = NOT_AVAILABLE`
- executive brief is empty
- Trends are shown as unranked intelligence
- Ask Radar says priority/actionability is unavailable rather than improvising

## 5. Intelligence hierarchy

```text
THEME_*
  └── TREND_*
        └── EVENT_*
              └── REC_*
                    └── source_url (if supplied)
```

Evidence is a parallel trace:

```text
TREND_*
  └── EVID_*
        └── REC_*
              └── source_url
```

## 6. RadarContext contract

```text
RadarContext = {
  dataset,
  themes,
  trends,
  events,
  records,
  evidence,
  analysis,
  matching,
  brs,
  actionability,
  source_links
}
```

Read-only responsibilities include:
- getDataset()
- getThemes()
- getTheme(id)
- getTrend(id)
- getEvent(id)
- getRecord(id)
- getEvidence(id)
- getTrendEvidence(id)
- getScores(id)
- getSourceLinks(id)
- getAnalysis(trendId)

## 7. Ask Radar supported investigation categories

- Relevance / importance
- Existing BRS explanation
- Existing actionability / authoritative-priority explanation when available
- Supporting evidence retrieval
- Contradictory evidence retrieval
- Trend/momentum analysis
- Creator concentration/analysis
- Evidence strength
- Missing-information/data-coverage explanation
- Related entity retrieval
- Comparisons grounded in retrieved entities
- Original source links

Ask Radar is **not** a web crawler, Instagram scraper, generic marketing assistant, campaign generator, media-buying tool, autonomous executor or future-virality predictor.

## 8. Runtime boundaries

- Gemini: `gemini-3.7-flash` by default, configurable with `RADAR_GEMINI_MODEL`.
- Embeddings: `gemini-embedding-2` by default, configurable with `RADAR_EMBEDDING_MODEL`.
- `GEMINI_API_KEY` is required server-side.
- `RADAR_DOVE_SIMILARITY_THRESHOLD` is optional only because the exact accepted value was not recoverable from the supplied implementation; absent means fail closed.
- Prototype state is held in server memory. Restarting the server clears uploaded workspaces/conversations.

## 9. Debugging rule

When a visible result looks wrong, debug from the earliest boundary that can create it:

```text
raw vendor field
→ mapping manifest
→ canonical record
→ dedup lineage
→ matching/BRS state
→ cluster membership
→ hierarchy membership
→ analysis
→ evidence role
→ authoritative priority (if any)
→ RadarContext
→ Ask Radar retrieval
→ Gemini explanation
→ UI rendering
```

Do not fix a downstream symptom by inserting a new score, hidden fallback, fake URL, inferred priority or prompt-only workaround.
