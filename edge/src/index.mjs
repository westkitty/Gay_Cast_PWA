import contract from '../../provider-contract.json' with { type: 'json' };
import {
  SEARCH_RESPONSE_SCHEMA_VERSION,
  canonicalResultKey,
  normalizeProviderReport,
  normalizeSearchResult
} from '../../search-contract.mjs';
import {
  ADAPTERS,
  buildProviderUrl,
  parseBarebackBastardsHtml,
  parseGayPornArchiveHtml,
  parseGayPornPlanetHtml,
  parseMachoTubeHtml,
  parseSunPornoHtml,
  parseXVideosHtml
} from './adapters.mjs';

export {buildProviderUrl,parseBarebackBastardsHtml,parseGayPornArchiveHtml,parseGayPornPlanetHtml,parseMachoTubeHtml,parseSunPornoHtml,parseXVideosHtml};

const PROVIDERS=new Map(contract.providers.map(provider=>[provider.id,provider]));
const JSON_HEADERS={'content-type':'application/json; charset=utf-8','cache-control':'no-store'};
const KNOWN_EDGE_STATES=new Map([['barebackbastards','VANTAGE_TIMEOUT'],['xvideos','VANTAGE_BLOCKED']]);

function cors(origin,env={}) {
  const allowed=env.ALLOWED_ORIGIN||'https://westkitty.github.io';
  return origin===allowed?{'access-control-allow-origin':origin,'vary':'Origin'}:{};
}
function json(body,status=200,origin='',env={}) {
  return new Response(JSON.stringify(body),{status,headers:{...JSON_HEADERS,...cors(origin,env)}});
}
function requestedProviders(url) {
  const raw=url.searchParams.get('providers');
  if(!raw)return [];
  return [...new Set(raw.split(',').map(value=>value.trim()).filter(Boolean))];
}
async function fetchBounded(url,timeoutMs=8000) {
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort('timeout'),timeoutMs);
  try {
    return await fetch(url,{
      redirect:'follow',
      signal:controller.signal,
      headers:{
        'user-agent':'GayCast-Edge/0.2 (+https://github.com/westkitty/Gay_Cast_PWA)',
        accept:'text/html,application/xhtml+xml'
      }
    });
  } finally {
    clearTimeout(timer);
  }
}
function upstreamBlockState(html,provider) {
  if(provider?.id==='xvideos'&&/<h1>Please visit\s*<a[^>]+xvideos\.com/i.test(html))return 'VANTAGE_BLOCKED';
  if(html.length<50000&&/cf-chl|challenge-platform|<title>Just a moment|cf-turnstile|access denied/i.test(html))return 'VANTAGE_BLOCKED';
  return null;
}
function report(provider,query,state,extra={}) {
  return normalizeProviderReport({
    providerId:provider.id,
    provider:provider.name,
    state,
    query,
    ...extra
  });
}
async function searchProvider(provider,query,page) {
  const knownState=KNOWN_EDGE_STATES.get(provider.id);
  if(knownState)return {...report(provider,query,knownState,{reason:'Known Cloudflare-vantage condition; upstream request intentionally skipped.'}),results:[]};

  const adapter=ADAPTERS.get(provider.id);
  if(!adapter)return {...report(provider,query,'ADAPTER_UNIMPLEMENTED',{reason:'No GayCast Edge adapter is implemented for this provider.'}),results:[]};

  const requestUrl=adapter.buildUrl(provider,query,page);
  const started=Date.now();
  const common={adapterId:adapter.id,adapterVersion:adapter.version,requestUrl};

  try {
    const response=await fetchBounded(requestUrl,8000);
    const statusState=adapter.statusState?.(response);
    if(statusState)return {...report(provider,query,statusState.state,{...common,httpStatus:response.status,finalUrl:response.url,elapsedMs:Date.now()-started,reason:statusState.reason}),results:[]};

    if(!response.ok)return {...report(provider,query,'HTTP_ERROR',{...common,httpStatus:response.status,finalUrl:response.url,elapsedMs:Date.now()-started,reason:`Upstream returned HTTP ${response.status}.`}),results:[]};

    const contentType=(response.headers.get('content-type')||'').toLowerCase();
    if(!contentType.includes('text/html'))return {...report(provider,query,'UNEXPECTED_CONTENT',{...common,finalUrl:response.url,elapsedMs:Date.now()-started,reason:`Unexpected upstream content type: ${contentType||'unknown'}.`}),results:[]};

    const html=await response.text();
    const blocked=upstreamBlockState(html,provider);
    if(blocked)return {...report(provider,query,blocked,{...common,finalUrl:response.url,elapsedMs:Date.now()-started,reason:'Upstream response indicates a Cloudflare-vantage block or challenge.'}),results:[]};

    const parsed=adapter.parse(html,provider,query).map(item=>normalizeSearchResult(item,provider.id)).filter(Boolean);
    const evidence=adapter.evaluate({response,html,results:parsed,query,provider});
    if(evidence.state!=='OK'){
      return {
        ...report(provider,query,evidence.state,{
          ...common,
          finalUrl:response.url,
          elapsedMs:Date.now()-started,
          resultCount:0,
          reason:evidence.reason
        }),
        results:[]
      };
    }

    return {
      ...report(provider,query,'OK',{
        ...common,
        finalUrl:response.url,
        elapsedMs:Date.now()-started,
        resultCount:parsed.length
      }),
      results:parsed
    };
  } catch(error) {
    const timeout=error?.name==='AbortError'||String(error?.message||'').toLowerCase()==='timeout';
    return {
      ...report(provider,query,timeout?'VANTAGE_TIMEOUT':'NETWORK_ERROR',{
        ...common,
        elapsedMs:Date.now()-started,
        reason:timeout?'Upstream did not complete within the bounded Edge fetch budget.':String(error?.message||'Upstream fetch failed.').slice(0,180)
      }),
      results:[]
    };
  }
}

export function dedupeAggregateResults(reportsWithResults=[]) {
  const results=[];
  const seen=new Set();
  for(const providerReport of reportsWithResults){
    for(const item of providerReport.results||[]){
      const key=item.dedupeKey||canonicalResultKey(item.url);
      if(seen.has(key))continue;
      seen.add(key);
      results.push(item);
    }
  }
  return results;
}

export async function handleRequest(request,env={}) {
  const url=new URL(request.url);
  const origin=request.headers.get('origin')||'';

  if(request.method==='OPTIONS')return new Response(null,{status:204,headers:{...cors(origin,env),'access-control-allow-methods':'GET,OPTIONS','access-control-allow-headers':'content-type'}});
  if(request.method!=='GET')return json({error:'method_not_allowed'},405,origin,env);

  if(url.pathname==='/health')return json({
    ok:true,
    contractId:contract.contractId,
    schemaVersion:SEARCH_RESPONSE_SCHEMA_VERSION,
    providerContractSchemaVersion:contract.schemaVersion,
    decidedProviders:contract.providers.length,
    edgeAdapters:[...ADAPTERS.values()].map(adapter=>({id:adapter.id,version:adapter.version})),
    knownEdgeStates:Object.fromEntries(KNOWN_EDGE_STATES)
  },200,origin,env);

  if(url.pathname==='/v1/providers')return json({
    contractId:contract.contractId,
    schemaVersion:SEARCH_RESPONSE_SCHEMA_VERSION,
    providers:contract.providers
      .filter(provider=>provider.supportState==='SUPPORTED')
      .map(provider=>{
        const adapter=ADAPTERS.get(provider.id);
        return {
          ...provider,
          edgeAdapter:Boolean(adapter),
          edgeAdapterId:adapter?.id,
          edgeAdapterVersion:adapter?.version,
          edgeState:adapter?'READY':(KNOWN_EDGE_STATES.get(provider.id)||'ADAPTER_UNIMPLEMENTED')
        };
      })
  },200,origin,env);

  if(url.pathname!=='/v1/search')return json({error:'not_found'},404,origin,env);

  const query=(url.searchParams.get('q')||'').trim();
  if(!query||query.length>120)return json({error:'invalid_query'},400,origin,env);

  if(env.SEARCH_RATE_LIMITER){
    const limited=await env.SEARCH_RATE_LIMITER.limit({key:'v1-search'});
    if(!limited.success)return json({error:'rate_limited'},429,origin,env);
  }

  const ids=requestedProviders(url);
  if(!ids.length)return json({error:'providers_required',allowed:contract.providers.filter(provider=>provider.supportState==='SUPPORTED').map(provider=>provider.id)},400,origin,env);
  if(ids.length>6)return json({error:'too_many_providers',max:6},400,origin,env);

  const providers=[];
  for(const id of ids){
    const provider=PROVIDERS.get(id);
    if(!provider||provider.supportState!=='SUPPORTED')return json({error:'provider_not_allowed',providerId:id},400,origin,env);
    providers.push(provider);
  }

  const page=Math.max(1,Math.min(20,Number.parseInt(url.searchParams.get('page')||'1',10)||1));
  const reportsWithResults=await Promise.all(providers.map(provider=>searchProvider(provider,query,page)));
  const results=dedupeAggregateResults(reportsWithResults);
  const reports=reportsWithResults.map(({results:ignored,...providerReport})=>providerReport);
  return json({
    schemaVersion:SEARCH_RESPONSE_SCHEMA_VERSION,
    contractId:contract.contractId,
    query,
    page,
    observedAt:new Date().toISOString(),
    reports,
    results
  },200,origin,env);
}

export default {fetch:handleRequest};
