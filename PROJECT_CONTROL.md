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
