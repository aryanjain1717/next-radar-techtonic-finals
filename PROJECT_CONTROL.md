# NEXT Radar — Project Control

Last updated: 28 Aug 2026

This file is the persistent source of truth for implementation status,
frozen architectural decisions, known issues and validation checkpoints.

No implementation phase is considered complete until:
1. implementation is complete;
2. tests pass;
3. cross-phase coherency is checked;
4. semantic completeness is checked where applicable;
5. known limitations are documented;
6. the approved change is committed to GitHub.

---
### ISSUE-001A — Source-to-Memory Mapping Overclaim

STATUS: OPEN
SEVERITY: HIGH

The first source-to-Brand-Memory mapping proposed potential coverage of:
- 89% strict supported weight
- 95% supported + partial weight

Human review rejected this mapping for implementation because several candidate
features exceeded the specificity of their underlying sources.

Examples identified:
- portfolio-level HUL strategy represented as Dove-specific strategy;
- unverified Dove target-audience wording;
- unsupported daily/weekly usage frequency;
- unverified geographic examples such as hard water;
- campaign-derived tone represented as formal brand personality;
- global/historical campaign chronology represented as India-specific precedent
  without sufficient source-level confirmation.

No Brand Memory feature from this mapping has been approved for implementation.

NEXT ACTION:
Run corrected evidence-constrained mapping before editing data/brand_memory.json.


### ISSUE-001B — Second-Pass Evidence Mapping

STATUS: REVIEWED AND ACCEPTED FOR CHANGE PLANNING
DATE: 28 Aug 2026

The second-pass source-to-memory audit applied:
- source specificity;
- no evidence amplification;
- atomic feature formulation;
- zero unsupported inference.

Accepted implementation boundary:

STRICTLY APPROVABLE WEIGHT: 75 / 100

Approved dimensions for governed Brand Memory repair:
- audience_overlap — 12% (existing legacy feature retained; no new audience claim approved)
- consumer_need_overlap — 12%
- usage_occasion_context_fit — 7%
- product_category_adjacency — 10%
- functional_benefit_product_truth_fit — 10%
- cultural_territory_alignment — 10%
- brand_purpose_values_alignment — 8%
- historical_activation_brand_permission — 6%

PARTIAL EVIDENCE — NOT APPROVED FOR BRS FEATURE CREATION:
- current_strategic_priority_alignment — 7%
- market_geographic_relevance — 7%

UNSUPPORTED — MUST REMAIN UNKNOWN:
- brand_personality_tone_alignment — 6%
- distinctive_brand_asset_semiotic_fit — 5%

Additional review constraints:
- Do not create a new "mass-to-masstige target audience" feature.
  Existing DOVE_LEGACY_AUDIENCE_001 remains the only audience feature for now.
- Usage occasion must be restricted to explicitly supported bathing/in-shower context.
  Do not create inferred daily/weekly routine-frequency features.
- No partial or unsupported dimension may be made scoreable merely to increase coverage.

TARGET POST-REPAIR SEMANTIC COVERAGE:
75 / 100 maximum assessable BRS weight.

No production Brand Memory changes have yet been made.

### ISSUE-001C — Proposed Brand Memory JSON failed implementation-contract review

STATUS: OPEN
SEVERITY: HIGH

The first proposed Brand Memory JSON additions were NOT approved for implementation.

Reasons:

1. The proposed JSON represented new knowledge as simple arrays such as
   consumer_needs, usage_occasions, product_categories and functional_benefits,
   while feature IDs, BRS dimensions, source IDs, provenance and governance
   metadata existed only in the accompanying explanation.

   It has not yet been proven that server/domain/dove-core.mjs consumes these
   proposed keys or preserves the required feature-level provenance.

2. DOVE_INDIA_OCCASION_002 ("hair-care format regimes and treatments") exceeded
   the approved usage-occasion evidence boundary and is rejected.

3. Proposed Dove "bodywash and body lotions" category evidence requires
   source-specific revalidation before approval; portfolio-level HUL category
   statements must not be converted into Dove-specific Brand Memory.

4. "Care & Protect campaign" is inaccurate wording. The cited HUL source describes
   Dove launching a Care & Protect range. Any future feature must preserve that
   distinction.

No data/brand_memory.json implementation has been approved.

NEXT ACTION:
Audit the exact data/brand_memory.json → dove-core.mjs loader contract before
deciding whether the repair is data-only or requires a controlled loader extension.


### ISSUE-001D — Brand Memory loader cannot consume governed dimensions

STATUS: CONFIRMED
SEVERITY: HIGH
IMPLEMENTATION PATH: CONTROLLED LOADER EXTENSION

Read-only loader-contract audit confirmed:

Current data/brand_memory.json Dove schema contains only:
- audience
- territories
- guardrails

Current server/domain/dove-core.mjs loader consumes only those three fields.

Proposed fields such as:
- consumer_needs
- usage_occasions
- product_categories
- functional_benefits
- brand_purpose
- historical_activations

are currently IGNORED.

An in-memory dry run proved that an added consumer_need value produced no semantic
Brand Memory feature.

Therefore a data-only repair is impossible.

Required controlled production change:
- server/domain/dove-core.mjs
- data/brand_memory.json

The change must be additive and preserve all 8 existing legacy features exactly.

Frozen downstream logic remains unchanged:
- 12 BRS dimensions and weights
- semantic threshold = 0.84
- embedding model/path
- cosine similarity
- 0–3 rating rubric
- UNKNOWN handling
- no renormalisation
- negative penalty = 10 × severity
- BRS bands
- actionability
- Option A prioritisation
- clustering/hierarchy/evidence/RadarContext

IMPLEMENTATION NOT YET APPROVED.

NEXT ACTION:
Freeze an explicit governed-feature schema and regression-test contract before editing
production code.

### ISSUE-001E — Controlled Loader Design Grounding Check

STATUS: CONDITIONAL PASS
DATE: 28 Aug 2026

The controlled governed-feature loader design is architecturally acceptable:

- preserve all 8 legacy features unchanged;
- append validated Dove.governed_features;
- retain existing loader API where possible;
- do not alter semantic matching, embeddings, cosine similarity, BRS,
  thresholds, actionability, clustering, evidence or RadarContext.

However, final design approval is blocked pending one source-grounding verification.

The design audit referenced call sites:
- server/domain/orchestration.mjs
- server/api/routes.mjs

These paths were not part of the previously verified final package tree.
They must be verified against the actual current repository rather than assumed.

Additional schema constraints now frozen:

1. Governed configuration uses exactly `text` as the proposition field.
   Loader maps config `text` → runtime `feature`.

2. Initial approved governed features may use only:
   evidence_scope = DOVE_INDIA_EXPLICIT

   Partial/global/portfolio evidence is not part of this first repair.

3. Official source URLs must be preserved when known.
   Nullable source_url remains allowed only where the underlying source genuinely
   lacks a usable URL.

No production implementation is approved until actual loader call sites and
runtime contract are verified against the current repository.


## 1. CURRENT MASTER ARCHITECTURE

Vendor CSV / JSON
→ ingestion
→ flexible schema mapping
→ normalization
→ deduplication
→ Dove semantic matching
→ record-level BRS
→ bottom-up candidate clustering
→ Cluster Analyst
→ Theme → Trend → Event → Record
→ Trend Analysis Pack
→ Evidence roles / strength / provenance
→ Option A Overview
→ RadarContext
→ Ask Radar

Dove-only current product experience.


### CHECKPOINT C1 — Governed Brand Memory Loader Design

STATUS: PASS
DATE: 28 Aug 2026

Actual repository grounding verified.

Confirmed existing files:
- server/domain/dove-core.mjs
- server/pipeline.mjs
- server/index.mjs

Confirmed nonexistent/hallucinated paths from prior audit:
- server/domain/orchestration.mjs
- server/api/routes.mjs

Actual runtime chain:

package.json
→ server/index.mjs
→ server/pipeline.mjs / runRadarPipeline
→ enrichWithDoveCore()
→ loadLegacyDoveMemory()
→ semantic embeddings
→ cosine qualification
→ assessBRS()
→ calculateBRS()

Controlled extension design accepted:

Existing legacy JSON fields remain unchanged:
- audience
- territories
- guardrails

Existing 8 DOVE_LEGACY_* runtime features must remain identical.

New governed configuration contract:

Dove.governed_features[]

Each configuration item uses:
- feature_id
- dimension
- text
- review_status
- support_status
- provenance
- evidence

Configuration uses ONLY `text`.

Loader converts:
config.text → runtime.feature

The runtime Brand Memory feature contract remains unchanged downstream.

First repair restrictions:
- evidence_scope = DOVE_INDIA_EXPLICIT only
- official source URLs preserved when available
- no current strategic priority features
- no market/geographic features
- no personality/tone features
- no distinctive asset/semiotic features
- no DOVE_INDIA_OCCASION_002
- no unsupported body-lotion/bodywash feature
- no "Care & Protect campaign" wording

Expected production change surface:
- server/domain/dove-core.mjs
- data/brand_memory.json

Expected additive tests:
- tests/contracts.test.mjs

No BRS formula, matching, embedding, threshold, actionability,
clustering, evidence or RadarContext redesign is permitted.

### ISSUE-001F — C4A Source Integrity Failure

STATUS: OPEN
SEVERITY: HIGH

The first final governed-feature proposal was NOT approved for insertion into
data/brand_memory.json.

Feature/dimension boundaries were largely compliant, but source integrity failed.

Confirmed defects:

1. source_url values were emitted as Markdown links rather than raw URL strings.

2. Multiple proposed source URLs were invalid / 404, including references used for:
   - SRC-DOVE-IN-003
   - SRC-DOVE-IN-004
   - SRC-DOVE-IN-005
   - SRC-DOVE-IN-006
   - SRC-DOVE-IN-007 / annual-report references

3. The proposal claimed "Zero URLs are invented", which was not supported by live
   verification.

4. SRC-DOVE-IN-005 was incorrectly redirected from the approved FY2024-25 Personal
   Care source to a nonexistent FY2023-24 Beauty & Wellbeing URL.

5. SRC-DOVE-IN-006 should use verified official HUL Integrated Report / R&D evidence
   rather than the nonexistent press-release URL.

6. Expected coverage was omitted from the final report.
   If the approved 8 dimensions remain supported:
   supported weight = 75 / 100
   unresolved weight = 25 / 100.

No governed features have been inserted into production data.

NEXT ACTION:
Freeze verified raw official HUL URLs and regenerate the exact governed feature
array without altering feature/dimension boundaries.

### CHECKPOINT C3 — Governed Brand Memory Loader Implementation

STATUS: PASS
DATE: 28 Aug 2026

Controlled governed-feature loader support has been implemented.

Production file changed:
- server/domain/dove-core.mjs

Test file added in C2:
- tests/dove-memory-loader.test.mjs

Validation Pass 1:
- npm test: 29 / 29 PASS

Independent Validation Pass 2:
- npm test: 29 / 29 PASS
- npm run check: PASS
- npm run build: PASS

Legacy compatibility:
- real legacy feature count: 8
- legacy deep equality: PASS
- legacy ordering: unchanged
- legacy IDs: unchanged
- legacy provenance/evidence: unchanged
- DOVE_INDIA_* governed features in real data: 0

Governed configuration contract:
- configuration proposition field = text
- loader maps text → runtime feature
- evidence_scope for first repair = DOVE_INDIA_EXPLICIT
- malformed governed features fail closed
- duplicate/colliding IDs fail closed
- invalid dimensions fail closed
- unsupported governance statuses fail closed

Frozen business logic changed:
NONE

Unchanged:
- BRS dimensions
- BRS weights
- BRS formula
- UNKNOWN handling
- negative-fit penalty
- BRS bands
- cosine matching
- semantic threshold = 0.84
- embedding provider/model path
- actionability
- Option A prioritisation
- clustering
- hierarchy
- evidence
- RadarContext
- Ask Radar

NEXT CHECKPOINT:
C4 — add audited Dove India governed Brand Memory data without modifying loader logic.

NEXT CHECKPOINT:
C2 — regression tests written before production implementation.
---

## 2. FROZEN CORE

Do not change without explicit approval:

- Dove Brand Memory/profile mechanism
- semantic matching mechanism
- embedding logic
- cosine similarity calculation
- 12 BRS dimensions
- BRS weights
- BRS 0–3 rating rubric
- UNKNOWN handling / no renormalization
- negative-fit penalty = 10 × severity
- BRS relevance bands
- existing matching architecture
- Option A fail-closed actionability/prioritisation boundary

No Trend-level BRS aggregation may be invented.
No Trend-level actionability may be invented.

---
## Recovery Checkpoint

Current baseline commit:
86567eb13525e4ddc943915c4cdc5b4f3d2ffe90


## 3. CURRENT CONFIGURATION
Current baseline commit:
86567eb13525e4ddc943915c4cdc5b4f3d2ffe90

RADAR_DOVE_SIMILARITY_THRESHOLD = 0.84

Status:
Prototype-calibrated semantic evidence qualification threshold.

Calibration result:
- Dove demo: 4/4 qualified at 0.84
- Dove-adjacent controls: 4/4
- ambiguous beauty controls: 1/4
- clearly unrelated controls: 0/4

This is a prototype calibration and is NOT an official HUL/Unilever threshold.

Production embedding model:
gemini-embedding-2

---

## 4. OPTION A PRIORITISATION

FROZEN.

If no authoritative prioritisation/actionability snapshot exists:

- prioritisation status = NOT_AVAILABLE;
- no fabricated rank;
- no fabricated actionability band;
- BRS cannot substitute for priority;
- momentum cannot substitute for priority;
- evidence strength cannot substitute for priority;
- engagement/volume cannot substitute for priority;
- Gemini cannot independently decide priority.

---

## 5. EVIDENCE ARCHITECTURE

Evidence roles are exactly:

- CORE_SUPPORT
- SUPPORTING
- CONTRADICTING
- PERIPHERAL

Evidence strength is exactly:

- STRONG
- MODERATE
- WEAK
- MIXED

No numeric evidence score.

---

## 6. CURRENT VALIDATION STATUS

Automated Node tests:
14 / 14 PASS

Structural pipeline coherency:
PASS

Real Gemini embedding runtime:
PASS

gemini-embedding-2:
PASS

RadarContext serialization:
PASS

Option A fail-closed behavior:
PASS

Source provenance:
PASS

Semantic completeness: FAIL — 22%
---

## 7. CONFIRMED OPEN ISSUES

### ISSUE-001 — Dove Brand Memory coverage

C### ISSUE-001 — Dove Brand Memory coverage

STATUS: CONFIRMED FAIL
SEVERITY: HIGH

Read-only semantic completeness audit completed 28 Aug 2026.

Coverage:
- Supported BRS weight: 22 / 100
- Partially supported weight: 0 / 100
- Unsupported weight: 78 / 100
- Maximum currently assessable weight: 22%

Currently supported positive dimensions:
- audience_overlap — 12%
- cultural_territory_alignment — 10%

Negative-fit guardrails exist separately and do not add positive assessable weight.

Conclusion:
The BRS architecture is structurally valid but is NOT yet semantically complete enough
for substantive production-style BRS interpretation.

No Brand Memory facts may be fabricated to close this gap.

NEXT ACTION:
Create an India-specific, source-backed Dove Brand Memory source ledger using official
HUL/Dove evidence. Review dimension mapping before modifying brand_memory.json.

### ISSUE-002 — Test provider vs production embedding divergence

FakeGeminiProvider uses a deterministic hashed test embedding whose cosine
distribution does not resemble gemini-embedding-2.

STATUS: KNOWN / CONTROLLED

Fake provider is acceptable for structural deterministic tests but must not
be used to validate semantic threshold quality.

### ISSUE-003 — Gemini generative quota

gemini-3.7-flash has produced 429 / 503 responses under free-tier usage.

STATUS: OPEN
SEVERITY: DEMO-RUNTIME RISK

Need bounded retry/backoff and call minimization validation before finals.

---

## 8. NEXT CHECKPOINT

Checkpoint C:

Dove Brand Memory 12-dimension semantic completeness audit.

No Brand Memory modification until audit is reviewed and approved.

---

## 9. REQUIRED VALIDATION REPORT FORMAT

Every future phase must end with:

Structural coherency: PASS / FAIL
Semantic completeness: PASS / PARTIAL / FAIL
Runtime validation: PASS / FAIL
Automated tests: X / X PASS
Production files changed: [...]
Frozen core files changed: NONE / [...]
Known limitations: [...]
GitHub commit: <commit hash or message>
