import crypto from 'node:crypto';

export class FakeGeminiProvider{
  constructor(){this.modelName='FAKE_GEMINI_TEST';this.embeddingModel='HASHED_TEST_EMBEDDING';}
  async embed(texts){return texts.map(hashVector);}
  async mapFields(){return {};}
  async assessBRS({qualifiedByDimension}){const dimensions={};for(const name of Object.keys(qualifiedByDimension)){if(name==='negative_fit')continue;dimensions[name]={rating:2,rationale:'Test judgment grounded in qualified Brand Memory feature.',memory_feature_ids:qualifiedByDimension[name].map(x=>x.feature_id),event_evidence_fields:['caption','topic']};}return {dimensions,negative_conflict:{severity:0,rationale:'No negative conflict in test fixture.',memory_feature_ids:[]}};}
  async reviewClusters(request){return {operations:request.clusters.map(c=>({action:'KEEP',cluster_ids:[c.cluster_id],rationale:'Coherent test cluster.'}))};}
  async repairClusterReview(x){return this.reviewClusters(x.request);}
  async interpretHierarchyGroup(input){return {title:'Real-skin confidence conversation',summary:'Repeated records connect unfiltered skin content with confidence and representation.',labels:['CULTURAL_SIGNAL','CONSUMER_BEHAVIOUR'],events:[{title:'Unfiltered skin sharing',summary:'A bounded manifestation of the recurring real-skin conversation.',labels:['CREATOR_CONTENT'],record_ids:[...input.group.record_ids]}]};}
  async repairHierarchyGroup({input}){return this.interpretHierarchyGroup(input);}
  async organizeThemes(input){return {themes:[{title:'Real beauty and confidence',summary:'Broad territory connecting representation and self-confidence.',labels:['CULTURAL_SIGNAL'],trend_ids:input.trends.map(t=>t.trend_id)}]};}
  async repairThemes({trends}){return this.organizeThemes({trends});}
  async interpretTrend(packet){const id=packet.trend.record_ids[0];const mk=analysis=>({status:'AVAILABLE',analysis,reason:'Supported by supplied Trend records.',evidence_record_ids:[id]});return {behavioural_pattern:mk('Creators repeatedly frame unfiltered skin sharing as confidence expression.'),cultural_interpretation:mk('The records connect beauty representation with authenticity.'),product_category_connection:mk('The conversation is adjacent to beauty and personal-care territory without proving demand.'),risk_tension:mk('There is a tension around authenticity and avoiding narrow beauty ideals.')};}
  async repairTrendInterpretation({packet}){return this.interpretTrend(packet);}
  async classifyEvidence(packet){return {assignments:packet.trend.record_ids.map((id,i)=>({record_id:id,role:i===0?'CORE_SUPPORT':'SUPPORTING',rationale:i===0?'Directly demonstrates the Trend claim.':'Corroborates the Trend claim.'}))};}
  async repairEvidenceClassification({packet}){return this.classifyEvidence(packet);}
  async composeAskRadar({intent,retrieved}){return {answer:`Grounded ${intent.toLowerCase().replaceAll('_',' ')} response from Radar state.`,claims:[{text:'This answer uses retrieved Radar state only.',type:'radar_derived_analysis',evidence_refs:collectIds(retrieved).slice(0,2)}],limitations:[],referenced_entities:collectIds(retrieved),suggested_followups:['Show me the evidence.','What data are we missing?']};}
}
function hashVector(text){const d=32,v=new Array(d).fill(0);for(const token of String(text).toLowerCase().match(/[a-z0-9]+/g)||[]){const h=crypto.createHash('sha1').update(token).digest();const idx=h[0]%d;v[idx]+=1;}const n=Math.sqrt(v.reduce((s,x)=>s+x*x,0))||1;return v.map(x=>x/n);}
function collectIds(x){const out=[];const walk=v=>{if(Array.isArray(v))for(const y of v)walk(y);else if(v&&typeof v==='object')for(const [k,y] of Object.entries(v)){if(/_id$/.test(k)&&typeof y==='string')out.push(y);walk(y);}};walk(x);return [...new Set(out)];}
