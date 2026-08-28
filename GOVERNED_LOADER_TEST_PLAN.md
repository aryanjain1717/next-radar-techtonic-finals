# Governed Dove Brand Memory Loader — Regression Test Plan

Status: FROZEN TEST CONTRACT
Implementation status: NOT STARTED

Purpose:
Protect all existing legacy Dove Brand Memory behaviour while introducing an
additive governed_features input contract.

---

## A. LEGACY REGRESSION

With the current legacy-only Dove configuration:

loadLegacyDoveMemory() must return exactly 8 features.

The first 8 features must remain identical in:

- array ordering
- feature_id
- dimension
- feature text
- support_status
- review_status
- provenance
- evidence objects

Expected IDs:

DOVE_LEGACY_AUDIENCE_001

DOVE_LEGACY_TERRITORY_001
DOVE_LEGACY_TERRITORY_002
DOVE_LEGACY_TERRITORY_003
DOVE_LEGACY_TERRITORY_004
DOVE_LEGACY_TERRITORY_005

DOVE_LEGACY_NEGATIVE_001
DOVE_LEGACY_NEGATIVE_002

No existing legacy behaviour may change.

---

## B. VALID GOVERNED FEATURE

Using an isolated temporary Brand Memory fixture containing the existing legacy
Dove data plus exactly one governed feature:

The loader must return 9 features.

The first 8 must deep-equal the legacy baseline.

The ninth must preserve:

- explicit feature_id
- explicit dimension
- text translated to runtime `feature`
- review_status
- support_status
- provenance
- complete evidence object
- source_url

Configuration field:
text

Runtime field:
feature

The configuration contract must NOT accept `feature` as an alternative to `text`.

---

## C. GOVERNED ID VALIDATION

Loader must fail closed when:

- feature_id is empty
- feature_id does not begin DOVE_INDIA_
- feature_id duplicates another governed feature
- feature_id collides with an existing legacy feature

No invalid governed feature may be silently ignored.

---

## D. DIMENSION VALIDATION

Loader must fail closed for an unknown BRS dimension.

Valid dimensions must come from the existing frozen dimension definition.

Loader validation must not duplicate or redefine BRS weights.

---

## E. GOVERNANCE VALIDATION

Loader must fail closed when:

review_status != APPROVED

or

support_status != VERIFIED

---

## F. TEXT VALIDATION

Loader must fail closed when:

- text is missing
- text is empty
- text contains whitespace only

A configuration object containing only `feature` and no `text` must fail.

---

## G. EVIDENCE VALIDATION

At least one evidence object is required.

Every evidence item must contain:

- non-empty source_id
- non-empty source_title
- non-empty evidence_summary
- evidence_scope = DOVE_INDIA_EXPLICIT

source_url may be null in the generic schema but must be preserved verbatim
when provided.

published_date and retrieved_date may be null.

Unsupported evidence scopes must fail closed in the first repair.

---

## H. ADDITIVITY

The presence of governed_features must not:

- remove legacy features
- mutate legacy features
- reorder legacy features
- change legacy IDs
- change legacy embeddings inputs
- modify BRS scoring rules

Governed features are appended after the complete legacy list.

---

## I. NO BUSINESS-LOGIC CHANGE

Tests must not require changes to:

- DIMENSION_WEIGHTS
- cosine()
- RADAR_DOVE_SIMILARITY_THRESHOLD
- semantic matching qualification
- BRS 0–3 rubric
- UNKNOWN handling
- negative-fit penalty
- BRS bands
- actionability
- Option A prioritisation
- clustering
- hierarchy
- evidence
- RadarContext

---

## J. TEST-FIRST EXPECTATION

Before production implementation:

- existing legacy regression behaviour should pass;
- governed-feature ingestion should fail;
- governed validation/fail-closed tests should fail because the loader does not
  yet implement governed_features.

These failures are expected and prove the new tests are exercising missing
behaviour rather than passing accidentally.

Production implementation begins only after these expected failures are reviewed.
