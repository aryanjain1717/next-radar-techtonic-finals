import { parseVendorText, buildMappingManifest, normalizeDataset } from './domain/ingestion.mjs';
import { deduplicateRecords } from './domain/dedup.mjs';
import { enrichWithDoveCore } from './domain/dove-core.mjs';
import { candidateCluster, reviewClusters } from './domain/clustering.mjs';
import { buildHierarchy } from './domain/hierarchy.mjs';
import { analyzeTrends } from './domain/trend-analysis.mjs';
import { buildEvidenceLayer } from './domain/evidence.mjs';
import { buildOverview } from './domain/overview.mjs';
import { buildRadarContext } from './domain/context.mjs';
import { RadarRetrievalService } from './domain/retrieval.mjs';
import { AskRadarService } from './ask-radar.mjs';

export async function runRadarPipeline({filename,text,provider,prioritySnapshot=null,config={}}){
  const parsed=parseVendorText({filename,text});
  const mapping=await buildMappingManifest(parsed,provider);
  const normalized=normalizeDataset(parsed,mapping);
  const dedup=await deduplicateRecords(normalized.records,provider);
  const dove=await enrichWithDoveCore(dedup.records,{provider,similarityThreshold:config.doveSimilarityThreshold??process.env.RADAR_DOVE_SIMILARITY_THRESHOLD??null});
  const candidates=await candidateCluster(dove.records,{provider,similarityThreshold:Number(config.discoverySimilarityThreshold??process.env.RADAR_DISCOVERY_SIMILARITY_THRESHOLD??0.72),topK:Number(config.discoveryTopK??process.env.RADAR_DISCOVERY_TOP_K??8),minClusterSize:Number(config.discoveryMinClusterSize??process.env.RADAR_DISCOVERY_MIN_CLUSTER_SIZE??2)});
  const reviewed=await reviewClusters(candidates,dove.records,{provider});
  const hierarchy=await buildHierarchy(reviewed,dove.records,{provider});
  const analysis=await analyzeTrends(hierarchy,dove.records,{provider});
  const evidence=await buildEvidenceLayer(hierarchy,analysis,dove.records,{provider});
  const overview=buildOverview({datasetId:parsed.dataset_id,hierarchy,trendAnalysis:analysis,evidence,records:dove.records,prioritySnapshot});
  const state={parsed,mapping,normalized_report:normalized.normalization_report,dedup_report:dedup.report,records:dove.records,brandMemory:dove.brand_memory,matchingConfig:dove.config,candidates,reviewed,hierarchy,analysis,evidence,overview};
  return finalizeState(state,provider);
}

export function applyAuthoritativePrioritization(state,provider,prioritySnapshot){
  const overview=buildOverview({datasetId:state.parsed.dataset_id,hierarchy:state.hierarchy,trendAnalysis:state.analysis,evidence:state.evidence,records:state.records,prioritySnapshot});
  return finalizeState({...state,overview},provider);
}

function finalizeState(state,provider){
  const datasetMeta={dataset_id:state.parsed.dataset_id,filename:state.parsed.filename,ingestion_report:state.parsed.report,mapping_manifest:state.mapping,normalization_report:state.normalized_report,dedup_report:state.dedup_report};
  const context=buildRadarContext({datasetMeta,records:state.records,brandMemory:state.brandMemory,matchingConfig:state.matchingConfig,candidateClusters:state.candidates,clusterReview:state.reviewed,hierarchy:state.hierarchy,trendAnalysis:state.analysis,evidence:state.evidence,overview:state.overview});
  const retrieval=new RadarRetrievalService(context);const ask=new AskRadarService(retrieval,provider,{datasetId:state.parsed.dataset_id});
  return {...state,context,retrieval,ask};
}

export function publicWorkspace(workspace){
  const c=workspace.context;return {dataset_id:c.dataset.dataset_id,filename:c.dataset.filename,overview:c.dataset.radar_overview,themes:c.themes,trends:c.trends,events:c.events,evidence_summaries:c.evidence.trend_summaries,analysis:c.analysis,config_status:{dove_matching:c.dataset.matching_config,prioritization:c.dataset.radar_overview.prioritization},stats:{records:c.records.length,themes:c.themes.length,trends:c.trends.length,events:c.events.length,evidence:c.evidence.assignments.length}};
}
