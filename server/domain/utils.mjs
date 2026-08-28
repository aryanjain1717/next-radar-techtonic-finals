import crypto from 'node:crypto';

export const clean = (v) => v === null || v === undefined ? null : (String(v).trim() || null);
export const clamp01 = (v) => Math.max(0, Math.min(1, Number(v) || 0));
export const clamp100 = (v) => Math.max(0, Math.min(100, Number(v) || 0));
export const deepCopy = (v) => v === undefined ? undefined : structuredClone(v);
export const sha256 = (text) => crypto.createHash('sha256').update(text).digest('hex');
export const stableId = (prefix, parts) => `${prefix}_${sha256(parts.join('|')).slice(0,12).toUpperCase()}`;
export const unique = (xs) => [...new Set(xs)];
export const isBlank = (v) => v === null || v === undefined || (typeof v === 'string' && !v.trim());
export function cosine(a,b){
  if (!Array.isArray(a)||!Array.isArray(b)||a.length!==b.length||a.length===0) throw new Error('Invalid cosine vectors');
  let dot=0,na=0,nb=0; for(let i=0;i<a.length;i++){const x=Number(a[i]),y=Number(b[i]); if(!Number.isFinite(x)||!Number.isFinite(y)) throw new Error('Non-finite vector'); dot+=x*y;na+=x*x;nb+=y*y;}
  if(na===0||nb===0) return 0; return dot/(Math.sqrt(na)*Math.sqrt(nb));
}
export function parseNumber(v){
  if(v===null||v===undefined||v==='') return null; if(typeof v==='number') return Number.isFinite(v)?v:null;
  const s=String(v).trim().replace(/,/g,''); const m=s.match(/^(-?\d+(?:\.\d+)?)\s*([KMB])?%?$/i); if(!m)return null;
  let n=Number(m[1]); const mult={K:1e3,M:1e6,B:1e9}[String(m[2]||'').toUpperCase()]||1; n*=mult; return Number.isFinite(n)?n:null;
}
export function parseTimestamp(v){
  const s=clean(v); if(!s)return null; const d=new Date(s); if(Number.isNaN(d.getTime()))return null; return d.toISOString();
}
export function toHashtags(v){
  if(v===null||v===undefined)return []; const raw=Array.isArray(v)?v:String(v).split(/[\s,;]+/); return unique(raw.map(x=>String(x).trim().replace(/^#/,'')).filter(Boolean));
}
export function buildContentText(r){
  const fields=['event_name','topic','trend','caption','post_text','transcript','description']; const parts=[];
  for(const f of fields){const v=clean(r[f]); if(v)parts.push(`${f}: ${v}`);} if(Array.isArray(r.hashtags)&&r.hashtags.length)parts.push(`hashtags: ${r.hashtags.join(' ')}`); return parts.join('\n');
}
export function assertUniqueIds(rows,key,label=key){ const seen=new Set(); for(const row of rows){const id=clean(row?.[key]); if(!id)throw new Error(`${label} missing`); if(seen.has(id))throw new Error(`Duplicate ${label}: ${id}`); seen.add(id);} return seen; }
export function ordinalIndex(text){const m=String(text).toLowerCase().match(/\b(first|second|third|fourth|fifth|1st|2nd|3rd|4th|5th)\b/); if(!m)return null; const map={first:0,'1st':0,second:1,'2nd':1,third:2,'3rd':2,fourth:3,'4th':3,fifth:4,'5th':4}; return map[m[1]];}
export function jsonResponse(res,status,payload){const body=JSON.stringify(payload);res.writeHead(status,{'content-type':'application/json; charset=utf-8','content-length':Buffer.byteLength(body)});res.end(body);}
