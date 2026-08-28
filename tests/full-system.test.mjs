import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { runRadarPipeline, applyAuthoritativePrioritization } from '../server/pipeline.mjs';
import { FakeGeminiProvider } from './helpers.mjs';

const csv=fs.readFileSync(new URL('../demo/sample_dove_vendor.csv',import.meta.url),'utf8');

async function build(extra={}){return runRadarPipeline({filename:'sample_dove_vendor.csv',text:csv,provider:new FakeGeminiProvider(),config:{discoverySimilarityThreshold:0.35,discoveryTopK:8,doveSimilarityThreshold:extra.doveSimilarityThreshold??null},prioritySnapshot:extra.prioritySnapshot??null});}

test('full 1→11 chain remains coherent and option A fails closed on priority',async()=>{
  const ws=await build();
  assert.equal(ws.context.dataset.radar_overview.status,'NOT_AVAILABLE');
  assert.equal(ws.context.dataset.radar_overview.executive_brief.length,0);
  assert.deepEqual(ws.context.dataset.radar_overview.unprioritized_trend_ids,ws.context.trends.map(t=>t.trend_id));
  assert.ok(ws.context.trends.length>=1);
  assert.equal(ws.context.records.length,4);
  assert.equal(ws.context.records[2].views,null,'missing numeric value must remain null');
  assert.equal(ws.context.records[3].caption.includes('Ignore previous instructions'),true,'prompt-like vendor text must remain data');
  assert.equal(ws.context.records[0].radar_outputs.existing_actionability.status,'NOT_RECONSTRUCTED');
  assert.equal(ws.context.records[0].radar_outputs.existing_brs.status,'NOT_AVAILABLE');
  const trendId=ws.context.trends[0].trend_id;
  const scores=ws.retrieval.getScores(trendId);
  assert.equal(scores.aggregation,'NO_NEW_AGGREGATION');
  assert.equal(scores.brs.value?.aggregation,'NOT_DEFINED_AT_TREND_LEVEL');
  assert.equal(scores.authoritative_priority,null);
  assert.deepEqual(ws.retrieval.getSourceLinks(ws.context.records[0].record_id),['https://example.com/reel/1']);
});

test('Ask Radar retrieves evidence, preserves follow-up order and does not invent actionability',async()=>{
  const ws=await build();const trendId=ws.context.trends[0].trend_id;
  const first=await ws.ask.ask({message:'Show me the evidence.',context:{dataset_id:ws.context.dataset.dataset_id,trend_id:trendId}});
  assert.equal(first.intent,'EVIDENCE_RETRIEVAL');assert.ok(first.evidence.length>=2);const secondRecord=first.evidence[1].record_id;
  const second=await ws.ask.ask({conversation_id:first.conversation_id,message:'Open the second one.',context:{dataset_id:ws.context.dataset.dataset_id,trend_id:trendId}});
  assert.equal(second.intent,'SOURCE_LINKS');assert.equal(second.resolved_context.record_id,secondRecord);assert.deepEqual(second.sources,ws.retrieval.getSourceLinks(secondRecord));
  const act=await ws.ask.ask({conversation_id:first.conversation_id,message:'Why is this actionable?',context:{dataset_id:ws.context.dataset.dataset_id,trend_id:trendId}});
  assert.equal(act.intent,'ACTIONABILITY_EXPLANATION');assert.match(act.answer,/not available|fail-closed/i);assert.equal(act.sources.length,0);
});

test('configured Dove threshold enables provisional record BRS without Trend aggregation',async()=>{
  const ws=await build({doveSimilarityThreshold:0});const rec=ws.context.records[0];assert.equal(rec.radar_outputs.existing_matching.status,'AVAILABLE');assert.equal(rec.radar_outputs.existing_brs.status,'PROVISIONAL');assert.ok(typeof rec.radar_outputs.existing_brs.score==='number');const trendId=ws.context.trends[0].trend_id;const scores=ws.retrieval.getScores(trendId);assert.equal(scores.brs.value.aggregation,'NOT_DEFINED_AT_TREND_LEVEL');
});

test('authoritative snapshot can be attached later but Radar never derives it',async()=>{
  const ws=await build();const refs=ws.context.trends.map((t,i)=>({trend_id:t.trend_id,band:i===0?'HIGH PRIORITY':'MONITOR',priority_rank:i+1,raw_output:{source:'test-authoritative-fixture'},source_event_ids:t.event_ids,source_record_ids:t.record_ids}));const updated=applyAuthoritativePrioritization(ws,new FakeGeminiProvider(),{dataset_id:ws.context.dataset.dataset_id,references:refs});assert.equal(updated.context.dataset.radar_overview.status,'AVAILABLE');assert.equal(updated.context.dataset.radar_overview.selection_method,'AUTHORITATIVE_PRIORITY_RANK_ONLY');assert.equal(updated.context.dataset.radar_overview.executive_brief[0].trend_id,refs[0].trend_id);
});

test('source URL drift is rejected at RadarContext boundary',async()=>{
  const ws=await build();const copy=structuredClone(ws.context);const evidence=copy.evidence.assignments.find(x=>x.source_url);assert.ok(evidence);const record=copy.records.find(r=>r.record_id===evidence.record_id);record.source_url='https://evil.example/replaced';// public context mutation itself does not mutate source workspace
  assert.notEqual(ws.retrieval.getRecord(record.record_id).source_url,record.source_url);
});
