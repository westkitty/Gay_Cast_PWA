export const SEARCH_RESPONSE_SCHEMA_VERSION = 1;
export const SEARCH_SNAPSHOT_SCHEMA_VERSION = 1;
export const SEARCH_CACHE_MAX_QUERIES = 30;
export const SEARCH_CACHE_MAX_RESULTS = 240;
export const SEARCH_CACHE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

export function normalizeQuery(value='') {
  return String(value).trim().replace(/\s+/g,' ').toLowerCase();
}

export function normalizeProviderIds(values=[]) {
  return [...new Set(values.map(value=>String(value).trim()).filter(Boolean))].sort();
}

export function providerSetKey(values=[]) {
  return normalizeProviderIds(values).join(',');
}

export function snapshotKey(query, providers=[]) {
  return `v${SEARCH_SNAPSHOT_SCHEMA_VERSION}|${encodeURIComponent(normalizeQuery(query))}|${encodeURIComponent(providerSetKey(providers))}`;
}

export function canonicalResultKey(raw='') {
  try {
    const url=new URL(raw);
    url.hostname=url.hostname.replace(/^www\./,'').toLowerCase();
    url.hash='';
    if(url.pathname.length>1)url.pathname=url.pathname.replace(/\/+$/,'');
    return url.toString();
  } catch {
    return String(raw).trim();
  }
}

function optional(target,key,value) {
  if(value!==undefined&&value!==null&&value!=='')target[key]=value;
}

export function normalizeSearchResult(item={}, fallbackProviderId='') {
  const providerId=String(item.providerId||fallbackProviderId||'').trim();
  const title=String(item.title||'').trim();
  const url=String(item.url||item.sourcePageUrl||'').trim();
  if(!providerId||!title||!/^https?:\/\//i.test(url))return null;
  const out={providerId,title,url,dedupeKey:String(item.dedupeKey||canonicalResultKey(url))};
  optional(out,'source',String(item.source||item.providerName||'').trim());
  optional(out,'mediaUrl',item.mediaUrl);
  optional(out,'thumbnail',item.thumbnail);
  if(Number.isFinite(item.duration))out.duration=item.duration;
  if(item.metadata&&typeof item.metadata==='object'&&!Array.isArray(item.metadata))out.metadata=item.metadata;
  return out;
}

export function evidenceIsTrusted(state='') {
  return state==='OK'||state==='EMPTY';
}

export function normalizeProviderReport(report={}, context={}) {
  const providerId=String(report.providerId||context.providerId||'').trim();
  const state=String(report.state||'UNKNOWN').trim();
  const observedAt=String(report.observedAt||context.observedAt||new Date().toISOString());
  const out={
    providerId,
    state,
    resultCount:Number.isFinite(report.resultCount)?report.resultCount:Array.isArray(report.results)?report.results.length:0,
    query:String(report.query??context.query??''),
    observedAt,
    trusted:typeof report.trusted==='boolean'?report.trusted:evidenceIsTrusted(state)
  };
  optional(out,'provider',String(report.provider||context.provider||'').trim());
  optional(out,'adapterId',String(report.adapterId||context.adapterId||'').trim());
  optional(out,'adapterVersion',String(report.adapterVersion||context.adapterVersion||'').trim());
  optional(out,'reason',String(report.reason||'').trim());
  if(Number.isFinite(report.elapsedMs))out.elapsedMs=report.elapsedMs;
  if(Number.isFinite(report.httpStatus))out.httpStatus=report.httpStatus;
  optional(out,'requestUrl',report.requestUrl);
  optional(out,'finalUrl',report.finalUrl);
  return out;
}

export function normalizeBrokerResponse(body={}) {
  const observedAt=String(body.observedAt||new Date().toISOString());
  const query=String(body.query||'');
  const reports=Array.isArray(body.reports)?body.reports.map(report=>normalizeProviderReport(report,{query,observedAt})).filter(report=>report.providerId):[];
  const trustedProviders=new Set(reports.filter(report=>report.trusted).map(report=>report.providerId));
  const seen=new Set();
  const results=[];
  for(const raw of Array.isArray(body.results)?body.results:[]) {
    const item=normalizeSearchResult(raw);
    if(!item||!trustedProviders.has(item.providerId)||seen.has(item.dedupeKey))continue;
    seen.add(item.dedupeKey);
    results.push(item);
  }
  return {
    schemaVersion:Number(body.schemaVersion)||SEARCH_RESPONSE_SCHEMA_VERSION,
    contractId:String(body.contractId||''),
    query,
    page:Number(body.page)||1,
    observedAt,
    reports,
    results
  };
}

export function validateSnapshot(snapshot, now=Date.now()) {
  if(!snapshot||snapshot.schemaVersion!==SEARCH_SNAPSHOT_SCHEMA_VERSION)return false;
  if(!snapshot.normalizedQuery||!snapshot.providerSetKey||!Number.isFinite(snapshot.capturedAt))return false;
  if(now-snapshot.capturedAt>SEARCH_CACHE_MAX_AGE_MS)return false;
  return Array.isArray(snapshot.results)&&Array.isArray(snapshot.reports);
}

export function trimSnapshots(records=[], now=Date.now()) {
  return records
    .filter(record=>validateSnapshot(record,now))
    .sort((a,b)=>b.capturedAt-a.capturedAt)
    .slice(0,SEARCH_CACHE_MAX_QUERIES);
}
