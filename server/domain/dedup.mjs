import { buildContentText, clean, cosine, parseTimestamp, stableId } from './utils.mjs';

const CUMULATIVE_METRICS=['views','likes','comments','shares','reach','impressions'];

export async function deduplicateRecords(records, semanticProvider){
  const byId=new Map(records.map(r=>[r.record_id,r])); if(byId.size!==records.length)throw new Error('Duplicate record_id before dedup');
  const groups=[];const used=new Set();
  const exactKeyMap=new Map();
  for(const r of records){const key=exactKey(r);if(!key)continue;if(!exactKeyMap.has(key))exactKeyMap.set(key,[]);exactKeyMap.get(key).push(r.record_id);}
  for(const ids of exactKeyMap.values()) if(ids.length>1) groups.push({ids:[...ids],method:'EXACT',confidence:1});
  // deterministic composite duplicate detection
  const compMap=new Map(); for(const r of records){const k=compositeKey(r); if(!k)continue;if(!compMap.has(k))compMap.set(k,[]);compMap.get(k).push(r.record_id);}for(const ids of compMap.values())if(ids.length>1)groups.push({ids:[...ids],method:'COMPOSITE',confidence:0.97});
  // merge overlapping deterministic groups first
  const mergedSets=mergeOverlapping(groups);
  for(const g of mergedSets) for(const id of g.ids) used.add(id);
  // semantic same-content pass only for not already grouped and same creator/account block
  const remaining=records.filter(r=>!used.has(r.record_id)&&buildContentText(r));
  if(semanticProvider&&remaining.length>1){
    const blockMap=new Map(); for(const r of remaining){const who=(clean(r.account)||clean(r.creator)||'').toLowerCase(); if(!who)continue;if(!blockMap.has(who))blockMap.set(who,[]);blockMap.get(who).push(r);}
    for(const block of blockMap.values()){if(block.length<2)continue;const vectors=await semanticProvider.embed(block.map(r=>buildContentText(r)),{purpose:'duplicate same-content detection'});const adj=new Map(block.map(r=>[r.record_id,new Set()]));for(let i=0;i<block.length;i++){for(let j=i+1;j<block.length;j++){if(!timeCompatible(block[i],block[j]))continue;const sim=cosine(vectors[i],vectors[j]);if(sim>=0.985){adj.get(block[i].record_id).add(block[j].record_id);adj.get(block[j].record_id).add(block[i].record_id);}}}for(const comp of connected(adj)){if(comp.length>1)mergedSets.push({ids:comp,method:'SEMANTIC_SAME_CONTENT',confidence:0.985});}
    }
  }
  const finalSets=mergeOverlapping(mergedSets);const memberToGroup=new Map();for(const g of finalSets)for(const id of g.ids)memberToGroup.set(id,g);
  const output=[];const visited=new Set();
  for(const r of records){if(visited.has(r.record_id))continue;const g=memberToGroup.get(r.record_id);if(!g){output.push({...structuredClone(r)});visited.add(r.record_id);continue;}const members=g.ids.map(id=>byId.get(id)).filter(Boolean);for(const m of members)visited.add(m.record_id);output.push(mergeGroup(members,g));}
  return {records:output,report:{records_received:records.length,records_after_dedup:output.length,duplicates_collapsed:records.length-output.length,groups:finalSets.map(g=>({...g,group_id:stableId('DUP',g.ids.slice().sort())}))}};
}

function exactKey(r){const url=clean(r.source_url);if(url)return `url:${url}`;const vendorId=r.vendor_metadata?.id||r.vendor_metadata?.content_id||r.vendor_metadata?.post_id||r.vendor_metadata?.reel_id;return vendorId?`vendor:${clean(r.platform)||''}:${vendorId}`:null;}
function compositeKey(r){const text=buildContentText(r).toLowerCase().replace(/\s+/g,' ').trim();const who=(clean(r.account)||clean(r.creator)||'').toLowerCase();const ts=clean(r.timestamp);if(!text||text.length<20||!who||!ts)return null;return `cmp:${who}:${ts.slice(0,10)}:${text}`;}
function timeCompatible(a,b){const da=parseTimestamp(a.timestamp),db=parseTimestamp(b.timestamp);if(!da||!db)return true;return Math.abs(new Date(da)-new Date(db))<=36*3600*1000;}
function mergeOverlapping(groups){const sets=groups.map(g=>({ids:new Set(g.ids),methods:new Set([g.method]),confidence:g.confidence}));let changed=true;while(changed){changed=false;outer:for(let i=0;i<sets.length;i++)for(let j=i+1;j<sets.length;j++){if([...sets[i].ids].some(x=>sets[j].ids.has(x))){for(const x of sets[j].ids)sets[i].ids.add(x);for(const m of sets[j].methods)sets[i].methods.add(m);sets[i].confidence=Math.max(sets[i].confidence,sets[j].confidence);sets.splice(j,1);changed=true;break outer;}}}return sets.map(s=>({ids:[...s.ids].sort(),method:[...s.methods].sort().join('+'),confidence:s.confidence}));}
function connected(adj){const seen=new Set(),out=[];for(const start of adj.keys()){if(seen.has(start))continue;const stack=[start],comp=[];seen.add(start);while(stack.length){const x=stack.pop();comp.push(x);for(const y of adj.get(x)||[])if(!seen.has(y)){seen.add(y);stack.push(y);}}out.push(comp.sort());}return out;}
function mergeGroup(members,g){
  members.sort((a,b)=>timestampValue(b)-timestampValue(a)||a.record_id.localeCompare(b.record_id));const primary=structuredClone(members[0]);const refs=members.map(m=>m.record_id).sort();primary.duplicate_count=members.length;primary.duplicate_refs=refs;primary.deduplication_method=g.method;primary.deduplication_confidence=g.confidence;
  for(const metric of CUMULATIVE_METRICS){const vals=members.map(m=>m[metric]).filter(v=>typeof v==='number'&&Number.isFinite(v));if(vals.length)primary[metric]=Math.max(...vals);}
  const meta={...(primary.vendor_metadata||{})};for(const m of members.slice(1)){for(const [k,v] of Object.entries(m.vendor_metadata||{})){if(!(k in meta))meta[k]=v;else if(JSON.stringify(meta[k])!==JSON.stringify(v)){meta[`duplicate_conflict__${m.record_id}__${k}`]=v;}}}primary.vendor_metadata=meta;return primary;
}
function timestampValue(r){const t=parseTimestamp(r.timestamp);return t?new Date(t).getTime():-Infinity;}
