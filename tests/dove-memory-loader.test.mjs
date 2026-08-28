import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { loadLegacyDoveMemory } from '../server/domain/dove-core.mjs';
import { BRS_DIMENSIONS } from '../server/domain/constants.mjs';

function createTempMemoryFile(doveObject) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dove-test-'));
  const filePath = path.join(dir, 'brand_memory.json');
  fs.writeFileSync(filePath, JSON.stringify({ Dove: doveObject }), 'utf8');
  return {
    filePath,
    cleanup() {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  };
}

const baseLegacyDove = {
  territories: [
    'real beauty',
    'self-esteem',
    'representation',
    'care',
    'confidence'
  ],
  audience: 'Broad beauty and personal-care consumers',
  guardrails: [
    'avoid reinforcing narrow beauty ideals',
    'preserve inclusive representation'
  ]
};

const validGovernedFeature = {
  feature_id: 'DOVE_INDIA_NEED_001',
  dimension: 'consumer_need_overlap',
  text: 'skin protection combined with moisturisation',
  review_status: 'APPROVED',
  support_status: 'VERIFIED',
  provenance: 'HUL_ANNUAL_REPORT_FY2020_21',
  evidence: [
    {
      source_id: 'SRC-DOVE-IN-001',
      source_url: 'https://hul-performance-highlights.hul.co.in/performance-highlights-fy-2020-21/beauty-personal-care.html',
      source_title: 'HUL Beauty & Personal Care Performance Highlights FY2020-21',
      published_date: '2021-05-01',
      retrieved_date: '2026-08-28',
      evidence_summary: 'Dove launched Care & Protect providing protection along with moisturisation.',
      evidence_scope: 'DOVE_INDIA_EXPLICIT'
    }
  ]
};

test('1 & 2: legacy-only loader returns exactly the original 8 features with deep equality', () => {
  const tempLegacy = createTempMemoryFile(baseLegacyDove);
  try {
    const memory = loadLegacyDoveMemory(tempLegacy.filePath);
    assert.equal(memory.brand_id, 'DOVE_INDIA');
    assert.equal(memory.features.length, 8);

    const expectedIds = [
      'DOVE_LEGACY_AUDIENCE_001',
      'DOVE_LEGACY_TERRITORY_001',
      'DOVE_LEGACY_TERRITORY_002',
      'DOVE_LEGACY_TERRITORY_003',
      'DOVE_LEGACY_TERRITORY_004',
      'DOVE_LEGACY_TERRITORY_005',
      'DOVE_LEGACY_NEGATIVE_001',
      'DOVE_LEGACY_NEGATIVE_002'
    ];
    assert.deepEqual(memory.features.map(f => f.feature_id), expectedIds);

    const audience = memory.features[0];
    assert.deepEqual(audience, {
      feature_id: 'DOVE_LEGACY_AUDIENCE_001',
      dimension: 'audience_overlap',
      feature: 'Broad beauty and personal-care consumers',
      support_status: 'VERIFIED',
      review_status: 'APPROVED',
      provenance: 'LEGACY_DEMO',
      evidence: [{
        source_id: 'LEGACY_PROTOTYPE',
        source_url: null,
        source_title: 'Supplied prototype data/brand_memory.json',
        published_date: null,
        retrieved_date: null,
        evidence_summary: 'Legacy prototype profile value supplied by the user; not official-source provenance.',
        evidence_scope: 'LEGACY_DEMO'
      }]
    });
  } finally {
    tempLegacy.cleanup();
  }
});

test('3, 4, 5 & 18: valid governed feature appends as ninth feature, maps config text to runtime feature, preserves evidence without mutating original 8', () => {
  const tempLegacy = createTempMemoryFile(baseLegacyDove);
  const doveWithGoverned = {
    ...baseLegacyDove,
    governed_features: [validGovernedFeature]
  };
  const temp = createTempMemoryFile(doveWithGoverned);
  try {
    const memory = loadLegacyDoveMemory(temp.filePath);
    assert.equal(memory.features.length, 9);

    const baseline = loadLegacyDoveMemory(tempLegacy.filePath);
    assert.deepEqual(memory.features.slice(0, 8), baseline.features);

    const ninth = memory.features[8];
    assert.equal(ninth.feature_id, 'DOVE_INDIA_NEED_001');
    assert.equal(ninth.dimension, 'consumer_need_overlap');
    assert.equal(ninth.feature, 'skin protection combined with moisturisation');
    assert.equal(ninth.review_status, 'APPROVED');
    assert.equal(ninth.support_status, 'VERIFIED');
    assert.equal(ninth.provenance, 'HUL_ANNUAL_REPORT_FY2020_21');
    assert.deepEqual(ninth.evidence, validGovernedFeature.evidence);
    assert.equal(ninth.evidence[0].source_url, 'https://hul-performance-highlights.hul.co.in/performance-highlights-fy-2020-21/beauty-personal-care.html');
  } finally {
    tempLegacy.cleanup();
    temp.cleanup();
  }
});

test('6: config using only feature instead of text should fail', () => {
  const invalid = { ...validGovernedFeature, feature: 'valid text but wrong key' };
  delete invalid.text;
  const temp = createTempMemoryFile({ ...baseLegacyDove, governed_features: [invalid] });
  try {
    assert.throws(
      () => loadLegacyDoveMemory(temp.filePath),
      /\[BrandMemoryLoader\] Invalid governed feature/
    );
  } finally {
    temp.cleanup();
  }
});

test('7: empty feature ID should fail', () => {
  const invalid = { ...validGovernedFeature, feature_id: '' };
  const temp = createTempMemoryFile({ ...baseLegacyDove, governed_features: [invalid] });
  try {
    assert.throws(
      () => loadLegacyDoveMemory(temp.filePath),
      /\[BrandMemoryLoader\] Invalid governed feature/
    );
  } finally {
    temp.cleanup();
  }
});

test('8: non-DOVE_INDIA_ feature ID should fail', () => {
  const invalid = { ...validGovernedFeature, feature_id: 'DOVE_GLOBAL_NEED_001' };
  const temp = createTempMemoryFile({ ...baseLegacyDove, governed_features: [invalid] });
  try {
    assert.throws(
      () => loadLegacyDoveMemory(temp.filePath),
      /\[BrandMemoryLoader\] Invalid governed feature/
    );
  } finally {
    temp.cleanup();
  }
});

test('9: duplicate governed feature ID should fail', () => {
  const temp = createTempMemoryFile({
    ...baseLegacyDove,
    governed_features: [validGovernedFeature, { ...validGovernedFeature, text: 'second variant' }]
  });
  try {
    assert.throws(
      () => loadLegacyDoveMemory(temp.filePath),
      /\[BrandMemoryLoader\] Invalid governed feature/
    );
  } finally {
    temp.cleanup();
  }
});

test('10: collision with legacy ID should fail', () => {
  const invalid = { ...validGovernedFeature, feature_id: 'DOVE_LEGACY_AUDIENCE_001' };
  const temp = createTempMemoryFile({ ...baseLegacyDove, governed_features: [invalid] });
  try {
    assert.throws(
      () => loadLegacyDoveMemory(temp.filePath),
      /\[BrandMemoryLoader\] Invalid governed feature/
    );
  } finally {
    temp.cleanup();
  }
});

test('11: unknown BRS dimension should fail', () => {
  const invalid = { ...validGovernedFeature, dimension: 'unsupported_dimension_xyz' };
  const temp = createTempMemoryFile({ ...baseLegacyDove, governed_features: [invalid] });
  try {
    assert.throws(
      () => loadLegacyDoveMemory(temp.filePath),
      /\[BrandMemoryLoader\] Invalid governed feature/
    );
  } finally {
    temp.cleanup();
  }
});

test('12: unapproved review status should fail', () => {
  const invalid = { ...validGovernedFeature, review_status: 'PENDING' };
  const temp = createTempMemoryFile({ ...baseLegacyDove, governed_features: [invalid] });
  try {
    assert.throws(
      () => loadLegacyDoveMemory(temp.filePath),
      /\[BrandMemoryLoader\] Invalid governed feature/
    );
  } finally {
    temp.cleanup();
  }
});

test('13: unverified support status should fail', () => {
  const invalid = { ...validGovernedFeature, support_status: 'UNVERIFIED' };
  const temp = createTempMemoryFile({ ...baseLegacyDove, governed_features: [invalid] });
  try {
    assert.throws(
      () => loadLegacyDoveMemory(temp.filePath),
      /\[BrandMemoryLoader\] Invalid governed feature/
    );
  } finally {
    temp.cleanup();
  }
});

test('14: missing/empty/whitespace text should fail', () => {
  for (const emptyText of ['', '   ', null, undefined]) {
    const invalid = { ...validGovernedFeature, text: emptyText };
    const temp = createTempMemoryFile({ ...baseLegacyDove, governed_features: [invalid] });
    try {
      assert.throws(
        () => loadLegacyDoveMemory(temp.filePath),
        /\[BrandMemoryLoader\] Invalid governed feature/
      );
    } finally {
      temp.cleanup();
    }
  }
});

test('15: missing evidence should fail', () => {
  const invalid = { ...validGovernedFeature, evidence: [] };
  const temp = createTempMemoryFile({ ...baseLegacyDove, governed_features: [invalid] });
  try {
    assert.throws(
      () => loadLegacyDoveMemory(temp.filePath),
      /\[BrandMemoryLoader\] Invalid governed feature/
    );
  } finally {
    temp.cleanup();
  }
});

test('16: empty source_id should fail', () => {
  const invalid = {
    ...validGovernedFeature,
    evidence: [{ ...validGovernedFeature.evidence[0], source_id: '' }]
  };
  const temp = createTempMemoryFile({ ...baseLegacyDove, governed_features: [invalid] });
  try {
    assert.throws(
      () => loadLegacyDoveMemory(temp.filePath),
      /\[BrandMemoryLoader\] Invalid governed feature/
    );
  } finally {
    temp.cleanup();
  }
});

test('17: unsupported evidence_scope should fail', () => {
  const invalid = {
    ...validGovernedFeature,
    evidence: [{ ...validGovernedFeature.evidence[0], evidence_scope: 'HUL_PORTFOLIO_LEVEL' }]
  };
  const temp = createTempMemoryFile({ ...baseLegacyDove, governed_features: [invalid] });
  try {
    assert.throws(
      () => loadLegacyDoveMemory(temp.filePath),
      /\[BrandMemoryLoader\] Invalid governed feature/
    );
  } finally {
    temp.cleanup();
  }
});

test('19: validator uses existing frozen dimension definitions from constants', () => {
  const definedDimensions = BRS_DIMENSIONS.map(([d]) => d);
  assert.equal(definedDimensions.length, 12);
  assert.ok(definedDimensions.includes('consumer_need_overlap'));
  assert.ok(definedDimensions.includes('audience_overlap'));
  assert.ok(definedDimensions.includes('distinctive_brand_asset_semiotic_fit'));
});

test('20: production brand_memory.json contains 8 legacy features + 21 governed features (29 total)', () => {
  const tempLegacy = createTempMemoryFile(baseLegacyDove);
  try {
    const legacyBaseline = loadLegacyDoveMemory(tempLegacy.filePath);
    const prodMemory = loadLegacyDoveMemory();

    assert.equal(prodMemory.features.length, 29);
    assert.deepEqual(prodMemory.features.slice(0, 8), legacyBaseline.features);

    const legacyFeatures = prodMemory.features.filter(f => f.feature_id.startsWith('DOVE_LEGACY_'));
    const governedFeatures = prodMemory.features.filter(f => f.feature_id.startsWith('DOVE_INDIA_'));
    assert.equal(legacyFeatures.length, 8);
    assert.equal(governedFeatures.length, 21);
    assert.deepEqual(prodMemory.features.slice(8), governedFeatures);
  } finally {
    tempLegacy.cleanup();
  }
});
