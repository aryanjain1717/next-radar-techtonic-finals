import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createGeminiProvider } from './gemini.mjs';
import { runRadarPipeline, applyAuthoritativePrioritization, publicWorkspace } from './pipeline.mjs';
import { jsonResponse } from './domain/utils.mjs';

const PORT=Number(process.env.PORT||3001);const __dirname=path.dirname(fileURLToPath(import.meta.url));const staticDir=path.resolve(__dirname,'../dist-client');const workspaces=new Map();let providerPromise=null;const getProvider=()=>providerPromise??=(createGeminiProvider());

const server=http.createServer(async(req,res)=>{try{
  if(req.method==='GET'&&req.url==='/api/health')return jsonResponse(res,200,{ok:true,gemini_configured:Boolean(process.env.GEMINI_API_KEY),dove_similarity_threshold_configured:Boolean(process.env.RADAR_DOVE_SIMILARITY_THRESHOLD),final_choice:'A_FAIL_CLOSED_PRIORITISATION'});
  if(req.method==='POST'&&req.url==='/api/analyze'){const body=await readJson(req);const provider=await getProvider();const ws=await runRadarPipeline({filename:body.filename,text:body.text,provider,prioritySnapshot:body.priority_snapshot||null,config:body.config||{}});workspaces.set(ws.context.dataset.dataset_id,ws);return jsonResponse(res,200,publicWorkspace(ws));}
  const mOverview=req.url?.match(/^\/api\/datasets\/([^/]+)$/);if(req.method==='GET'&&mOverview){const ws=requireWs(mOverview[1]);return jsonResponse(res,200,publicWorkspace(ws));}
  const mPrior=req.url?.match(/^\/api\/datasets\/([^/]+)\/prioritization$/);if(req.method==='POST'&&mPrior){const old=requireWs(mPrior[1]);const body=await readJson(req);const provider=await getProvider();const ws=applyAuthoritativePrioritization(old,provider,body);workspaces.set(mPrior[1],ws);return jsonResponse(res,200,publicWorkspace(ws));}
  if(req.method==='POST'&&req.url==='/api/ask'){const body=await readJson(req);const ws=requireWs(body.context?.dataset_id||body.dataset_id);const result=await ws.ask.ask(body);return jsonResponse(res,200,result);}
  const mEntity=req.url?.match(/^\/api\/datasets\/([^/]+)\/(trend|event|record|evidence)\/([^/]+)$/);if(req.method==='GET'&&mEntity){const ws=requireWs(mEntity[1]),kind=mEntity[2],id=decodeURIComponent(mEntity[3]);const fn={trend:'getTrend',event:'getEvent',record:'getRecord',evidence:'getEvidence'}[kind];const entity=ws.retrieval[fn](id);let extra={};if(kind==='trend')extra={analysis:ws.retrieval.getAnalysis(id),evidence:ws.retrieval.getTrendEvidence(id),scores:ws.retrieval.getScores(id),sources:ws.retrieval.getSourceLinks(id)};else extra={scores:ws.retrieval.getScores(id),sources:ws.retrieval.getSourceLinks(id)};return jsonResponse(res,200,{entity,...extra});}
  if(req.url?.startsWith('/api/'))return jsonResponse(res,404,{error:'API route not found'});
  return serveStatic(req,res);
}catch(e){console.error(e);return jsonResponse(res,500,{error:e.message||'Server error'});}});
server.listen(PORT,()=>console.log(`NEXT Radar server listening on ${PORT}`));

function requireWs(id){const ws=workspaces.get(id);if(!ws)throw new Error('Active Radar dataset not found on this server session');return ws;}
async function readJson(req){let body='';for await(const chunk of req){body+=chunk;if(body.length>20_000_000)throw new Error('Request too large');}if(!body)return {};try{return JSON.parse(body);}catch{throw new Error('Invalid JSON request body');}}
function serveStatic(req,res){if(!fs.existsSync(staticDir))return jsonResponse(res,200,{message:'NEXT Radar server is running. Build the client with npm run build or use npm run dev.'});let rel=decodeURIComponent((req.url||'/').split('?')[0]);if(rel==='/'||!path.extname(rel))rel='/index.html';const file=path.resolve(staticDir,'.'+rel);if(!file.startsWith(staticDir)||!fs.existsSync(file)||fs.statSync(file).isDirectory()){const fallback=path.join(staticDir,'index.html');if(fs.existsSync(fallback)){res.writeHead(200,{'content-type':'text/html'});return fs.createReadStream(fallback).pipe(res);}return jsonResponse(res,404,{error:'Not found'});}const ext=path.extname(file);const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.json':'application/json'}[ext]||'application/octet-stream';res.writeHead(200,{'content-type':mime});fs.createReadStream(file).pipe(res);}
