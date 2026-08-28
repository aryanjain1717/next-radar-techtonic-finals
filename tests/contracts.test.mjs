import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {parseVendorText,buildMappingManifest,normalizeDataset} from '../server/domain/ingestion.mjs';
import {runRadarPipeline,applyAuthoritativePrioritization} from '../server/pipeline.mjs';
import {FakeGeminiProvider} from './helpers.mjs';
const csv=fs.readFileSync(new URL('../demo/sample_dove_vendor.csv',import.meta.url),'utf8');
const build=()=>runRadarPipeline({filename:'demo.csv',text:csv,provider:new FakeGeminiProvider(),config:{discoverySimilarityThreshold:.35,doveSimilarityThreshold:null}});

test('JSON container and canonical null semantics remain intact',async()=>{const parsed=parseVendorText({filename:'x.json',text:JSON.stringify({data:[{post_copy:'hello',plays_count:null,permalink:'https://x.example/1'}]})});const manifest=await buildMappingManifest(parsed,new FakeGeminiProvider());const n=normalizeDataset(parsed,manifest);assert.equal(n.records[0].caption,'hello');assert.equal(n.records[0].views,null);assert.equal(n.records[0].source_url,'https://x.example/1');});

test('RadarContext serializes and retrieval returns defensive copies',async()=>{const ws=await build();assert.doesNotThrow(()=>JSON.stringify(ws.context));const id=ws.context.records[0].record_id;const a=ws.retrieval.getRecord(id);a.caption='mutated';assert.notEqual(ws.retrieval.getRecord(id).caption,'mutated');});

test('partial priority snapshot is rejected instead of silently ranking subset',async()=>{const ws=await build();const all=ws.context.trends;assert.ok(all.length>=1);const refs=all.length===1?[]:[{trend_id:all[0].trend_id,band:'HIGH',priority_rank:1,raw_output:{}}];assert.throws(()=>applyAuthoritativePrioritization(ws,new FakeGeminiProvider(),{dataset_id:ws.context.dataset.dataset_id,references:refs}),/cover every Trend|references/i);});

test('unknown priority Trend is rejected',async()=>{const ws=await build();assert.throws(()=>applyAuthoritativePrioritization(ws,new FakeGeminiProvider(),{dataset_id:ws.context.dataset.dataset_id,references:[{trend_id:'TREND_UNKNOWN',band:'HIGH',priority_rank:1,raw_output:{}}]}),/unknown Trend|cover every Trend/i);});

test('missing source URL is reported rather than fabricated',async()=>{const noUrl=csv.replace('https://example.com/reel/1','');const ws=await runRadarPipeline({filename:'demo.csv',text:noUrl,provider:new FakeGeminiProvider(),config:{discoverySimilarityThreshold:.35,doveSimilarityThreshold:null}});const rid=ws.context.records[0].record_id;assert.deepEqual(ws.retrieval.getSourceLinks(rid),[]);const ans=await ws.ask.ask({message:`Open original for ${rid}`,context:{dataset_id:ws.context.dataset.dataset_id}});assert.match(ans.answer,/not supplied/i);assert.deepEqual(ans.sources,[]);});

test('unknown entity fails gracefully in Ask Radar',async()=>{const ws=await build();const ans=await ws.ask.ask({message:'Why does REC_DOES_NOT_EXIST matter?',context:{dataset_id:ws.context.dataset.dataset_id}});assert.match(ans.answer,/could not retrieve|could not find/i);});

test('client source never references server Gemini key',()=>{const app=fs.readFileSync(new URL('../client/src/App.jsx',import.meta.url),'utf8');assert.equal(/GEMINI_API_KEY/.test(app),false);});

test('priority selection method cannot be changed by evidence strength',async()=>{const ws=await build();const refs=ws.context.trends.map((t,i)=>({trend_id:t.trend_id,band:'BAND_FROM_AUTHORITY',priority_rank:ws.context.trends.length-i,raw_output:{authoritative:true}}));const updated=applyAuthoritativePrioritization(ws,new FakeGeminiProvider(),{dataset_id:ws.context.dataset.dataset_id,references:refs});const expected=[...refs].sort((a,b)=>a.priority_rank-b.priority_rank).map(x=>x.trend_id);assert.deepEqual(updated.context.dataset.radar_overview.executive_brief.map(x=>x.trend_id),expected.slice(0,5));});

test('Gemini 3.7 provider uses current SDK line and avoids deprecated low-temperature config',()=>{
  const pkg=JSON.parse(fs.readFileSync(new URL('../package.json',import.meta.url),'utf8'));
  assert.match(pkg.dependencies['@google/genai'],/^\^2\./);
  const gemini=fs.readFileSync(new URL('../server/gemini.mjs',import.meta.url),'utf8');
  assert.match(gemini,/gemini-3\.7-flash/);
  assert.equal(/temperature\s*:/.test(gemini),false);
  assert.match(gemini,/gemini-embedding-2/);
});
