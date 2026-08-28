import fs from 'node:fs';
import { BRS_DIMENSIONS } from './constants.mjs';
import { buildContentText, clean, clamp100, cosine } from './utils.mjs';

export function loadLegacyDoveMemory(path=new URL('../../data/brand_memory.json',import.meta.url)){
  const payload=JSON.parse(fs.readFileSync(path,'utf8')); const dove=payload.Dove;if(!dove||typeof dove!=='object')throw new Error('brand_memory.json must contain Dove');const features=[];
  if(clean(dove.audience))features.push(feature('DOVE_LEGACY_AUDIENCE_001','audience_overlap',String(dove.audience)));
  for(const [i,t] of (Array.isArray(dove.territories)?dove.territories:[]).entries())if(clean(t))features.push(feature(`DOVE_LEGACY_TERRITORY_${String(i+1).padStart(3,'0')}`,'cultural_territory_alignment',String(t)));
  for(const [i,t] of (Array.isArray(dove.guardrails)?dove.guardrails:[]).entries())if(clean(t))features.push(feature(`DOVE_LEGACY_NEGATIVE_${String(i+1).padStart(3,'0')}`,'negative_fit',String(t)));

  if(Array.isArray(dove.governed_features)){
    const seenIds=new Set(features.map(f=>f.feature_id));
    const permittedDimensions=new Set([...BRS_DIMENSIONS.map(([d])=>d),'negative_fit']);
    for(const item of dove.governed_features){
      if(!item||typeof item!=='object')throw new Error('[BrandMemoryLoader] Invalid governed feature: item must be an object');
      const fid=typeof item.feature_id==='string'?item.feature_id.trim():'';
      if(!fid)throw new Error('[BrandMemoryLoader] Invalid governed feature "": feature_id is required');
      if(!fid.startsWith('DOVE_INDIA_'))throw new Error(`[BrandMemoryLoader] Invalid governed feature "${fid}": feature_id must start with DOVE_INDIA_`);
      if(seenIds.has(fid))throw new Error(`[BrandMemoryLoader] Invalid governed feature "${fid}": duplicate or colliding feature_id`);
      if(!permittedDimensions.has(item.dimension))throw new Error(`[BrandMemoryLoader] Invalid governed feature "${fid}": unknown or unpermitted dimension "${item.dimension}"`);
      if(typeof item.text!=='string'||!item.text.trim())throw new Error(`[BrandMemoryLoader] Invalid governed feature "${fid}": text is required and cannot be empty or whitespace`);
      if(item.review_status!=='APPROVED')throw new Error(`[BrandMemoryLoader] Invalid governed feature "${fid}": review_status must be APPROVED, got "${item.review_status}"`);
      if(item.support_status!=='VERIFIED')throw new Error(`[BrandMemoryLoader] Invalid governed feature "${fid}": support_status must be VERIFIED, got "${item.support_status}"`);
      if(!Array.isArray(item.evidence)||item.evidence.length===0)throw new Error(`[BrandMemoryLoader] Invalid governed feature "${fid}": evidence must be a non-empty array`);
      for(const ev of item.evidence){
        if(!ev||typeof ev!=='object')throw new Error(`[BrandMemoryLoader] Invalid governed feature "${fid}": evidence item must be an object`);
        const sid=typeof ev.source_id==='string'?ev.source_id.trim():'';
        if(!sid)throw new Error(`[BrandMemoryLoader] Invalid governed feature "${fid}": source_id is required`);
        if(ev.evidence_scope!=='DOVE_INDIA_EXPLICIT')throw new Error(`[BrandMemoryLoader] Invalid governed feature "${fid}": evidence_scope must be DOVE_INDIA_EXPLICIT, got "${ev.evidence_scope}"`);
      }
      seenIds.add(fid);
      features.push({
        feature_id: fid,
        dimension: item.dimension,
        feature: item.text.trim(),
        review_status: item.review_status,
        support_status: item.support_status,
        provenance: item.provenance,
        evidence: structuredClone(item.evidence)
      });
    }
  }

  return {brand_id:'DOVE_INDIA',brand_name:'Dove',market:'India',version:'legacy-demo-v1',memory_status:'LEGACY_DEMO',features};
}
function feature(feature_id,dimension,text){return {feature_id,dimension,feature:text,support_status:'VERIFIED',review_status:'APPROVED',provenance:'LEGACY_DEMO',evidence:[{source_id:'LEGACY_PROTOTYPE',source_url:null,source_title:'Supplied prototype data/brand_memory.json',published_date:null,retrieved_date:null,evidence_summary:'Legacy prototype profile value supplied by the user; not official-source provenance.',evidence_scope:'LEGACY_DEMO'}]};}

export async function enrichWithDoveCore(records,{provider,similarityThreshold,memory=loadLegacyDoveMemory()}){
  const threshold=similarityThreshold===null||similarityThreshold===undefined||similarityThreshold===''?null:Number(similarityThreshold);if(threshold!==null&&(!Number.isFinite(threshold)||threshold<0||threshold>1))throw new Error('RADAR_DOVE_SIMILARITY_THRESHOLD must be 0..1');
  if(threshold===null){return {records:records.map(r=>({...structuredClone(r),radar_outputs:{...(r.radar_outputs||{}),existing_matching:{status:'NOT_AVAILABLE',reason:'Exact frozen Dove cosine threshold is not configured.'},existing_brs:{status:'NOT_AVAILABLE',reason:'BRS gate is unavailable because the frozen Dove cosine threshold is not configured.'},existing_scoring:{status:'NOT_RECONSTRUCTED'},existing_actionability:{status:'NOT_RECONSTRUCTED'}}})),brand_memory:memory,config:{similarity_threshold:null,status:'FAIL_CLOSED'}};}
  if(!provider)throw new Error('Semantic provider required when Dove matching is enabled');
  const usable=memory.features; const featureVectors=await provider.embed(usable.map(f=>`Brand Memory feature: ${f.feature}`),{purpose:'Dove Brand Memory semantic matching'});
  const output=[];
  for(const original of records){const r=structuredClone(original);const text=buildContentText(r);if(!text){r.radar_outputs={...(r.radar_outputs||{}),existing_matching:{status:'NOT_AVAILABLE',reason:'No usable content text.'},existing_brs:{status:'NOT_AVAILABLE',reason:'No usable content text.'},existing_scoring:{status:'NOT_RECONSTRUCTED'},existing_actionability:{status:'NOT_RECONSTRUCTED'}};output.push(r);continue;}
    const [eventVector]=await provider.embed([`Event evidence: ${text}`],{purpose:'Dove semantic relevance matching'});const matches=usable.map((f,i)=>({feature_id:f.feature_id,dimension:f.dimension,feature:f.feature,similarity:cosine(eventVector,featureVectors[i]),qualified:false,evidence:f.evidence})).map(x=>({...x,qualified:x.similarity>=threshold}));const qualified=matches.filter(x=>x.qualified);const byDim={};for(const q of qualified){if(!byDim[q.dimension])byDim[q.dimension]=[];byDim[q.dimension].push(q);}const matching={status:'AVAILABLE',threshold,qualified_feature_ids:qualified.map(x=>x.feature_id),features:matches};
    const judgment=await provider.assessBRS({record:stripUntrustedInstructions(r),qualifiedByDimension:byDim,dimensions:BRS_DIMENSIONS.map(([name,weight])=>({name,weight}))});const brs=calculateBRS(judgment,byDim);
    r.radar_outputs={...(r.radar_outputs||{}),existing_matching:matching,existing_brs:brs,existing_scoring:{status:'NOT_RECONSTRUCTED'},existing_actionability:{status:'NOT_RECONSTRUCTED'}};output.push(r);
  }
  return {records:output,brand_memory:memory,config:{similarity_threshold:threshold,status:'AVAILABLE'}};
}

function stripUntrustedInstructions(r){const x={};for(const k of ['record_id','event_name','topic','trend','caption','post_text','transcript','description','hashtags','timestamp','platform','creator','account','source_url'])x[k]=r[k];return x;}
function calculateBRS(judgment,qualified){
  const ratings=judgment?.dimensions||{};let raw=0,assessed=0;const dimensions={};for(const [name,weight] of BRS_DIMENSIONS){let rating=null;let rationale='No threshold-qualified Brand Memory evidence for this dimension.';let memory_feature_ids=[];if(Array.isArray(qualified[name])&&qualified[name].length){const j=ratings[name];if(j&&[0,1,2,3].includes(j.rating)){rating=j.rating;rationale=String(j.rationale||'');memory_feature_ids=(j.memory_feature_ids||[]).filter(id=>qualified[name].some(q=>q.feature_id===id));if(memory_feature_ids.length===0&&rating!==null){rating=null;rationale='Assessment did not cite threshold-qualified Brand Memory evidence.';}}}
    const contribution=rating===null?0:weight*(rating/3);if(rating!==null){raw+=contribution;assessed+=weight;}dimensions[name]={dimension:name,rating,status:rating===null?'UNKNOWN':'ASSESSED',weight,contribution:Number(contribution.toFixed(6)),rationale,memory_feature_ids,event_evidence_fields:Array.isArray(ratings[name]?.event_evidence_fields)?ratings[name].event_evidence_fields:[]};}
  const negQualified=qualified.negative_fit||[];let sev=Number(judgment?.negative_conflict?.severity||0);if(![0,1,2,3].includes(sev))sev=0;let negIds=(judgment?.negative_conflict?.memory_feature_ids||[]).filter(id=>negQualified.some(q=>q.feature_id===id));if(sev>0&&!negIds.length)sev=0;const penalty=10*sev;const unresolved=100-assessed;const score=clamp100(raw-penalty);const max=clamp100(raw+unresolved-penalty);return {status:unresolved>0?'PROVISIONAL':'FINAL',score:Number(score.toFixed(6)),band:score<40?'NOT_RELEVANT_ARCHIVE':score<60?'WEAK_RELEVANCE':'MATERIALLY_RELEVANT',raw_score:Number(raw.toFixed(6)),negative_conflict:sev,negative_penalty:penalty,assessed_weight:assessed,unresolved_weight:unresolved,maximum_possible_score:Number(max.toFixed(6)),profile:{name:'DOVE_DEFAULT',version:'v1'},dimensions,negative_conflict_evidence:{severity:sev,rationale:String(judgment?.negative_conflict?.rationale||''),memory_feature_ids:negIds}};
}
