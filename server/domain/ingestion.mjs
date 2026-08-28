import { CANONICAL_FIELDS, FIELD_ALIASES, FIELD_DESCRIPTIONS, NUMERIC_FIELDS, TEXT_FIELDS } from './constants.mjs';
import { clean, isBlank, parseNumber, parseTimestamp, toHashtags, sha256, clamp01 } from './utils.mjs';

const AUTO_MAP_THRESHOLD=0.80;
const MAPPABLE=CANONICAL_FIELDS.filter(x=>!['record_id','dataset_id','vendor_metadata','radar_outputs','duplicate_count','duplicate_refs','deduplication_method','deduplication_confidence'].includes(x));

export function parseVendorText({filename,text}){
  if(typeof text!=='string') throw new Error('Vendor file text is required');
  const ext=(filename||'').toLowerCase().split('.').pop();
  const dataset_id=`DATASET_${sha256(text).slice(0,16).toUpperCase()}`;
  let records=[]; const skipped=[]; let received=0;
  if(ext==='json'){
    let payload; try{payload=JSON.parse(text.replace(/^\uFEFF/,''));}catch(e){throw new Error(`JSON parsing failed: ${e.message}`);}
    let rows, positions;
    if(Array.isArray(payload)){rows=payload;positions=rows.map((_,i)=>i+1);}
    else if(payload&&typeof payload==='object'){
      const key=['records','events','data','items'].find(k=>Array.isArray(payload[k]));
      if(key){rows=payload[key];positions=rows.map((_,i)=>`${key}[${i}]`);} else {rows=[payload];positions=['root'];}
    } else throw new Error('JSON root must be an object or array');
    for(let i=0;i<rows.length;i++){received++;const r=rows[i]; if(!r||typeof r!=='object'||Array.isArray(r)){skipped.push({source_position:positions[i],reason:'RECORD_NOT_OBJECT'});continue;} if(Object.values(r).every(isBlank)){skipped.push({source_position:positions[i],reason:'EMPTY_RECORD'});continue;} records.push({...r});}
  } else if(ext==='csv'){
    const rows=parseCsv(text.replace(/^\uFEFF/,'')); if(rows.length===0) throw new Error('CSV file does not contain a header row');
    const headers=rows[0].map(h=>String(h).trim()); if(headers.some(h=>!h))throw new Error('CSV contains an empty column header'); if(new Set(headers).size!==headers.length)throw new Error('CSV contains duplicate column headers');
    for(let i=1;i<rows.length;i++){const row=rows[i]; if(row.length===1&&row[0]==='')continue;received++; if(row.length!==headers.length){skipped.push({source_position:i+1,reason:'COLUMN_COUNT_MISMATCH'});continue;} const obj=Object.fromEntries(headers.map((h,j)=>[h,row[j]])); if(Object.values(obj).every(isBlank)){skipped.push({source_position:i+1,reason:'EMPTY_RECORD'});continue;} records.push(obj);}
  } else throw new Error('Only CSV and JSON are supported');
  return {dataset_id,filename,records,report:{dataset_id,filename,file_type:ext,records_received:received,records_parsed:records.length,records_skipped:skipped.length,skipped_records:skipped}};
}

function parseCsv(text){
  const rows=[];let row=[],field='',quoted=false;
  for(let i=0;i<text.length;i++){const c=text[i]; if(quoted){if(c==='"'&&text[i+1]==='"'){field+='"';i++;}else if(c==='"')quoted=false;else field+=c;}else{if(c==='"')quoted=true;else if(c===','){row.push(field);field='';}else if(c==='\n'){row.push(field.replace(/\r$/,''));rows.push(row);row=[];field='';}else field+=c;}}
  if(quoted)throw new Error('CSV parsing failed: unclosed quoted field'); if(field.length||row.length){row.push(field.replace(/\r$/,''));rows.push(row);} return rows;
}

function normName(s){return String(s).toLowerCase().trim().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'');}
function nameScore(source,target){const s=normName(source),aliases=new Set([target,...(FIELD_ALIASES[target]||[])].map(normName)); if(aliases.has(s))return 1; const st=new Set(s.split('_')); let best=0; for(const a of aliases){const at=new Set(a.split('_')); const inter=[...st].filter(x=>at.has(x)).length;const union=new Set([...st,...at]).size;const token=union?inter/union:0;const prefix=s.startsWith(a)||a.startsWith(s)?0.8:0;best=Math.max(best,0.7*token+0.3*prefix);} return best>=0.35?best:0;}
function dataTypeScore(samples,target){const vals=samples.filter(v=>!isBlank(v));if(!vals.length)return 0;let ok=0;for(const v of vals){if(NUMERIC_FIELDS.has(target))ok+=parseNumber(v)!==null?1:0;else if(target==='hashtags')ok+=(Array.isArray(v)||typeof v==='string')?1:0;else if(TEXT_FIELDS.has(target))ok+=['string','number'].includes(typeof v)?1:0;}return ok/vals.length;}
function valuePatternScore(samples,target){const vals=samples.filter(v=>!isBlank(v));if(!vals.length)return 0;let ok=0;for(const v of vals){const s=String(v).trim();if(NUMERIC_FIELDS.has(target))ok+=parseNumber(v)!==null?1:0;else if(target==='source_url')ok+=/^https?:\/\//i.test(s)?1:0;else if(target==='timestamp')ok+=parseTimestamp(v)!==null?1:0;else if(target==='hashtags')ok+=(Array.isArray(v)||/#|,|\s/.test(s))?1:0;else if(target==='platform')ok+=/instagram|youtube|tiktok|facebook|twitter|\bx\b|reddit/i.test(s)?1:0;else ok+=s.length>0?0.75:0;}return ok/vals.length;}

export async function buildMappingManifest(parsed,semanticProvider){
  const sourceFields=[];const seen=new Set();for(const r of parsed.records){for(const k of Object.keys(r)){if(!seen.has(k)){seen.add(k);sourceFields.push(k);}}}
  const proposals=[];
  for(const source of sourceFields){const samples=parsed.records.map(r=>r[source]).filter(v=>!isBlank(v)).slice(0,8); const aliasScores=Object.fromEntries(MAPPABLE.map(t=>[t,nameScore(source,t)])); const exact=MAPPABLE.filter(t=>aliasScores[t]===1); let semantic={};let semanticSource='NONE';
    if(exact.length){semantic=Object.fromEntries(exact.map(t=>[t,1]));semanticSource='CURATED_ALIAS';}
    else if(semanticProvider){try{semantic=await semanticProvider.mapFields({sourceField:source,samples,canonicalFields:MAPPABLE,fieldDescriptions:FIELD_DESCRIPTIONS});semanticSource='GEMINI';}catch{semantic={};semanticSource='GEMINI_ERROR';}}
    const candidates=MAPPABLE.map(target=>{const evidence={alias:clamp01(aliasScores[target]),datatype:dataTypeScore(samples,target),value_pattern:valuePatternScore(samples,target),semantic:clamp01(semantic?.[target]||0),semantic_source:semanticSource};const confidence=0.30*evidence.alias+0.15*evidence.datatype+0.15*evidence.value_pattern+0.40*evidence.semantic;return {source_field:source,canonical_field:target,confidence,evidence};}).sort((a,b)=>b.confidence-a.confidence||b.evidence.alias-a.evidence.alias||b.evidence.datatype-a.evidence.datatype||b.evidence.value_pattern-a.evidence.value_pattern||b.evidence.semantic-a.evidence.semantic||a.canonical_field.localeCompare(b.canonical_field));
    const best=candidates[0];proposals.push(best.confidence>=AUTO_MAP_THRESHOLD?{...best,status:'AUTO_MAPPED'}:{...best,canonical_field:null,status:'UNMAPPED_LOW_CONFIDENCE'});
  }
  const byTarget=new Map();const result={};for(const p of proposals){if(!p.canonical_field){result[p.source_field]=p;continue;}if(!byTarget.has(p.canonical_field))byTarget.set(p.canonical_field,[]);byTarget.get(p.canonical_field).push(p);}for(const [target,arr] of byTarget){arr.sort((a,b)=>b.confidence-a.confidence||b.evidence.alias-a.evidence.alias||b.evidence.datatype-a.evidence.datatype||b.evidence.value_pattern-a.evidence.value_pattern||b.evidence.semantic-a.evidence.semantic||a.source_field.localeCompare(b.source_field));result[arr[0].source_field]=arr[0];for(const loser of arr.slice(1))result[loser.source_field]={...loser,canonical_field:null,status:`UNMAPPED_TARGET_CONFLICT:${target}`};}
  return {dataset_id:parsed.dataset_id,auto_map_threshold:AUTO_MAP_THRESHOLD,weights:{alias:0.30,datatype:0.15,value_pattern:0.15,semantic:0.40},schema_mapping:result};
}

export function normalizeDataset(parsed,manifest){
  const records=[];const issues=[];for(let i=0;i<parsed.records.length;i++){const raw=parsed.records[i];const record=emptyRecord(parsed.dataset_id,i+1);for(const [source,value] of Object.entries(raw)){const d=manifest.schema_mapping[source];if(!d?.canonical_field){record.vendor_metadata[source]=value;continue;}const target=d.canonical_field;const norm=normalizeValue(value,target);if(norm.ok)record[target]=norm.value;else{record.vendor_metadata[source]=value;issues.push({record_id:record.record_id,source_field:source,target,reason:norm.reason});}}
    records.push(record);
  }
  return {dataset_id:parsed.dataset_id,records,mapping_manifest:manifest,normalization_report:{records_normalized:records.length,issues}};
}
function emptyRecord(datasetId,index){const r={};for(const f of CANONICAL_FIELDS)r[f]=null;r.record_id=`REC_${String(index).padStart(6,'0')}`;r.dataset_id=datasetId;r.hashtags=[];r.duplicate_count=1;r.duplicate_refs=[r.record_id];r.deduplication_method='NONE';r.vendor_metadata={};r.radar_outputs={existing_matching:{status:'NOT_RUN'},existing_brs:{status:'NOT_RUN'},existing_scoring:{status:'NOT_RECONSTRUCTED'},existing_actionability:{status:'NOT_RECONSTRUCTED'}};return r;}
function normalizeValue(v,target){if(isBlank(v))return {ok:true,value:null};if(NUMERIC_FIELDS.has(target)){const n=parseNumber(v);return n===null?{ok:false,reason:'NUMERIC_COERCION_FAILED'}:{ok:true,value:n};}if(target==='hashtags')return {ok:true,value:toHashtags(v)};if(target==='timestamp'){const ts=parseTimestamp(v);return ts?{ok:true,value:ts}:{ok:false,reason:'TIMESTAMP_PARSE_FAILED'};}return {ok:true,value:String(v).trim()};}
