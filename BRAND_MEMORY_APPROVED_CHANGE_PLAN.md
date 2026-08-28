# Dove India Brand Memory — Approved Change Plan

Status: CHANGE PLAN ONLY
Implementation status: NOT STARTED

This file defines the maximum allowed scope of the next Brand Memory change.

No production logic may be changed.

---

## 1. FROZEN IMPLEMENTATION BOUNDARY

Approved maximum assessable BRS weight after this repair:

75 / 100

Partial and unsupported dimensions remain intentionally unresolved.

---

## 2. EXISTING FEATURES TO RETAIN UNCHANGED

### audience_overlap

Retain:

DOVE_LEGACY_AUDIENCE_001

Text:
Broad beauty and personal-care consumers

Do not create a new masstige/premium audience-targeting feature.

### cultural_territory_alignment

Retain existing:

DOVE_LEGACY_TERRITORY_001
DOVE_LEGACY_TERRITORY_002
DOVE_LEGACY_TERRITORY_003
DOVE_LEGACY_TERRITORY_004
DOVE_LEGACY_TERRITORY_005

Do not delete or rewrite these features during this change.

### negative_fit

Retain existing:

DOVE_LEGACY_NEGATIVE_001
DOVE_LEGACY_NEGATIVE_002

Negative-fit features remain guardrails and do not contribute positive assessable weight.

---

## 3. DIMENSIONS APPROVED FOR NEW FEATURES

### consumer_need_overlap

Approved source-backed concepts:

1. Skin protection together with moisturisation.
   Source: SRC-DOVE-IN-001

2. Hair-fall concern.
   Source: SRC-DOVE-IN-003

3. Bathing skin concerns including acne, exfoliation and glow.
   Source: SRC-DOVE-IN-005

4. Hair thinning and scalp-health concerns.
   Source: SRC-DOVE-IN-006

5. Scalp dryness and itchiness.
   Source: SRC-DOVE-IN-006

Keep propositions atomic where practical.

---

### usage_occasion_context_fit

Approved source-backed concept:

1. Bathing / in-shower experience.
   Source: SRC-DOVE-IN-005

Do not add:
- daily frequency;
- morning/evening routines;
- weekly frequency;
- inferred lifestyle rituals.

---

### product_category_adjacency

Approved Dove-linked formats only:

1. Cleansing bars.
   Source: SRC-DOVE-IN-004

2. Bodywash.
   Source: SRC-DOVE-IN-003 / SRC-DOVE-IN-004

3. Shower-serum.
   Source: SRC-DOVE-IN-005

4. Hair care.
   Source: SRC-DOVE-IN-002

5. Hair mask.
   Source: SRC-DOVE-IN-004

6. Scalp/hair therapy serum.
   Source: SRC-DOVE-IN-006

Do not add categories not explicitly connected to Dove.

---

### functional_benefit_product_truth_fit

Approved source-backed concepts:

1. Protection together with moisturisation.
   Source: SRC-DOVE-IN-001

2. Dove shower-serum range was co-created with dermatologists and uses pro-ceramides.
   Source: SRC-DOVE-IN-005

3. Dove Scalp+Hair Therapy formulation contains niacinamide and zinc-peptides.
   Source: SRC-DOVE-IN-006

4. HUL describes the relevant Dove scalp/hair proposition as science-backed with
   clinically proven results.
   Source: SRC-DOVE-IN-006

Do not infer additional efficacy claims from ingredients.

---

### cultural_territory_alignment

Existing legacy features already cover this dimension.

New official-source features may only strengthen provenance for:

- Real Beauty / body positivity
- self-esteem
- challenging narrow beauty standards / stereotypes
- inclusive beauty representation

Sources:
SRC-DOVE-IN-001
SRC-DOVE-IN-002
SRC-DOVE-IN-007

Do not create materially broader cultural territories.

---

### brand_purpose_values_alignment

Approved source-backed concepts:

1. Promoting Real Beauty.
   Source: SRC-DOVE-IN-007

2. Raising self-esteem in girls.
   Source: SRC-DOVE-IN-007

3. Challenging societal beauty stereotypes through Dove's beauty-purpose activity.
   Sources: SRC-DOVE-IN-001 / SRC-DOVE-IN-002

Do not infer a broader corporate values taxonomy.

---

### historical_activation_brand_permission

Approved India-specific precedent concepts:

1. Dove India hair-care launch / established India hair-care presence.
   Source: SRC-DOVE-IN-002

2. Care & Protect India activity.
   Source: SRC-DOVE-IN-001

3. #StopTheBeautyTest India activity.
   Sources: SRC-DOVE-IN-001 / SRC-DOVE-IN-002

Use general Real Beauty / Choose Beautiful history only as contextual Dove history
unless India-specific applicability is explicitly established.

---

## 4. DIMENSIONS NOT APPROVED FOR NEW SEMANTIC FEATURES

### current_strategic_priority_alignment

STATUS: PARTIAL

Do not add any feature yet.

Reason:
Some current Dove innovations are explicit, but broader strategic-priority framing
remains mixed with HUL Beauty & Wellbeing portfolio-level strategy.

Expected BRS state:
UNKNOWN when no existing governed feature supports the dimension.

---

### market_geographic_relevance

STATUS: PARTIAL

Do not add any feature yet.

Reason:
Winning in Many Indias is an HUL operating framework and current evidence does not
sufficiently define Dove-specific geographic/regional permissions.

Expected BRS state:
UNKNOWN.

---

### brand_personality_tone_alignment

STATUS: UNSUPPORTED

Do not add inferred personality or tone adjectives.

Expected BRS state:
UNKNOWN.

---

### distinctive_brand_asset_semiotic_fit

STATUS: UNSUPPORTED

Do not invent visual, sonic, colour, logo, packaging or semiotic features.

Expected BRS state:
UNKNOWN.

---

## 5. ABSOLUTELY FROZEN CODE / LOGIC

Do not change:

- semantic matching implementation;
- embedding provider/model behavior;
- cosine similarity calculation;
- RADAR_DOVE_SIMILARITY_THRESHOLD = 0.84;
- BRS dimensions;
- BRS weights;
- 0–3 BRS rating rubric;
- UNKNOWN handling;
- no-renormalisation rule;
- negative conflict penalty = 10 × severity;
- BRS relevance bands;
- actionability logic;
- Option A fail-closed prioritisation;
- clustering;
- hierarchy;
- evidence architecture;
- RadarContext contract.

---

## 6. EXPECTED POST-CHANGE STATE

Maximum supported positive BRS weight:

75 / 100

Intentionally unresolved:

25 / 100

- current strategic priority: 7
- market/geographic relevance: 7
- personality/tone: 6
- distinctive assets/semiotics: 5

This unresolved weight is expected and must not be hidden.

---

## 7. IMPLEMENTATION SAFETY RULE

Before editing data/brand_memory.json:

AI Studio must first produce the exact proposed JSON objects for review.

No implementation may occur until those objects are reviewed and explicitly approved.
