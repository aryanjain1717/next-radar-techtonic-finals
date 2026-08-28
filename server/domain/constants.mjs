export const CANONICAL_FIELDS = [
  'record_id','dataset_id','event_name','topic','trend','caption','post_text','transcript','description',
  'hashtags','timestamp','platform','creator','account','source_url','views','likes','comments','shares',
  'engagement','reach','impressions','duplicate_count','duplicate_refs','deduplication_method',
  'deduplication_confidence','vendor_metadata','radar_outputs'
];

export const NUMERIC_FIELDS = new Set(['views','likes','comments','shares','engagement','reach','impressions']);
export const TEXT_FIELDS = new Set(['event_name','topic','trend','caption','post_text','transcript','description','platform','creator','account','source_url','timestamp']);

export const FIELD_ALIASES = {
  event_name:['event_name','event','event_title','event_label','story_name'],
  topic:['topic','subject','conversation_topic','content_topic','theme_topic'],
  trend:['trend','trend_name','trend_label','trend_topic','trend_title'],
  caption:['caption','post_caption','reel_caption','content_caption','post_copy','copy'],
  post_text:['post_text','post_body','body_text','content_text','text','post_content'],
  transcript:['transcript','video_transcript','audio_transcript','speech_text','reel_transcript'],
  description:['description','content_description','post_description','summary','content_summary'],
  hashtags:['hashtags','hash_tags','tags','hashtag_list','hashtags_list'],
  timestamp:['timestamp','datetime','date_time','posted_at','posted_on','created_at','published_at','publish_time','publication_date','date'],
  platform:['platform','channel','social_platform','network','source_platform'],
  creator:['creator','creator_name','author','author_name','influencer','profile_name'],
  account:['account','account_name','username','user_name','handle','profile_handle'],
  source_url:['source_url','url','post_url','reel_url','content_url','permalink','link','original_url','original_link'],
  views:['views','view_count','views_count','play_count','plays_count','play_total','content_plays','video_views','reel_views','plays'],
  likes:['likes','like_count','likes_count','total_likes'],
  comments:['comments','comment_count','comments_count','total_comments'],
  shares:['shares','share_count','shares_count','total_shares','reposts'],
  engagement:['engagement','engagement_count','engagements','engagement_rate','interaction_rate','interactions'],
  reach:['reach','reach_count','accounts_reached','unique_reach'],
  impressions:['impressions','impression_count','impressions_count','total_impressions']
};

export const FIELD_DESCRIPTIONS = {
  event_name:'vendor-supplied name or title of a discrete event',
  topic:'topic or subject discussed by the content',
  trend:'vendor-supplied trend name or trend label',
  caption:'caption attached to a social post or reel',
  post_text:'main textual body/content of a post',
  transcript:'spoken-content transcript from video or audio',
  description:'description or summary of the content',
  hashtags:'hashtags or tag list associated with content',
  timestamp:'publication, creation, or posting date/time',
  platform:'social/content platform',
  creator:'creator, author, or influencer display name',
  account:'account username or social handle',
  source_url:'original post, reel, or content URL/permalink',
  views:'number of views or plays',likes:'number of likes',comments:'number of comments',shares:'number of shares/reposts',
  engagement:'engagement count or engagement-rate value',reach:'number of unique accounts/people reached',impressions:'number of impressions'
};

export const BRS_DIMENSIONS = [
  ['audience_overlap',12],['consumer_need_overlap',12],['usage_occasion_context_fit',7],['product_category_adjacency',10],
  ['functional_benefit_product_truth_fit',10],['cultural_territory_alignment',10],['brand_purpose_values_alignment',8],
  ['brand_personality_tone_alignment',6],['distinctive_brand_asset_semiotic_fit',5],['current_strategic_priority_alignment',7],
  ['market_geographic_relevance',7],['historical_activation_brand_permission',6]
];

export const TAXONOMY = new Set(['CULTURAL_SIGNAL','CONSUMER_BEHAVIOUR','PRODUCT_CATEGORY','CREATOR_CONTENT','ENGAGEMENT_MOMENTUM','RISK_TENSION','EMERGENT_OTHER']);
export const EVIDENCE_ROLES = new Set(['CORE_SUPPORT','SUPPORTING','CONTRADICTING','PERIPHERAL']);
export const ANALYSIS_STATES = new Set(['AVAILABLE','NOT_AVAILABLE','INSUFFICIENT_EVIDENCE']);
