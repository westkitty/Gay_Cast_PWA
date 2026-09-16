import contract from '../../provider-contract.json' with { type: 'json' };

const PROVIDERS = new Map(contract.providers.map(p => [p.id, p]));
const JSON_HEADERS = {'content-type':'application/json; charset=utf-8','cache-control':'no-store'};
const ADAPTERS = new Map([['barebackbastards',{version:'barebackbastards-edge-v1',parseText:parseBarebackBastardsHtml}],['gaypornplanet',{version:'gaypornplanet-edge-v1',parseText:parseGayPornPlanetHtml}],['xvideos',{version:'xvideos-edge-v2',parseText:parseXVideosHtml}]]);

function cors(origin, env={}) {
  const allowed = env.ALLOWED_ORIGIN || 'https://westkitty.github.io';
  return origin === allowed ? {'access-control-allow-origin':origin,'vary':'Origin'} : {};
}
function json(body,status=200,origin='',env={}) {
  return new Response(JSON.stringify(body),{status,headers:{...JSON_HEADERS,...cors(origin,env)}});
}
export function buildProviderUrl(provider, query, page=1) {
  if (!provider?.searchTemplate) throw new Error('provider has no search template');
  const encoded = encodeURIComponent(query.trim()).replace(/%20/g,'+');
  const n = provider.pagination === 'ZERO_BASED_QUERY_PAGE' ? Math.max(0,page-1) : Math.max(1,page);
  return provider.searchTemplate.replaceAll('{query}',encoded).replaceAll('{page}',String(n));
}
function requestedProviders(url) {
  const raw=url.searchParams.get('providers');
  if(!raw) return [];
  return [...new Set(raw.split(',').map(x=>x.trim()).filter(Boolean))];
}
async function fetchBounded(url, timeoutMs=8000) {
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort('timeout'),timeoutMs);
  try { return await fetch(url,{redirect:'follow',signal:controller.signal,headers:{'user-agent':'GayCast-Edge/0.1 (+https://github.com/westkitty/Gay_Cast_PWA)','accept':'text/html,application/xhtml+xml'}}); }
  finally { clearTimeout(timer); }
}
function decodeEntities(value='') {
  return value.replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>');
}
function tagAttr(tag,name) {
  const m=tag.match(new RegExp(`\\b${name}\\s*=\\s*(["'])(.*?)\\1`,'i'));
  return m ? decodeEntities(m[2]) : '';
}

export function parseBarebackBastardsHtml(html, provider) {
  const out=[], seen=new Set();
  const pattern=/<a\b([^>]*\bclass=["'][^"']*\bthumbnail\b[^"']*["'][^>]*)>/gi;
  for(const match of html.matchAll(pattern)) {
    const tag=match[1], href=tagAttr(tag,'href'), title=tagAttr(tag,'title').trim();
    if(!title || !/^\/\d+\/[a-z0-9][^?#]*\/?$/i.test(href)) continue;
    const url=new URL(href,'https://barebackbastards.com').href;
    if(seen.has(url)) continue;
    seen.add(url); out.push({title,url,providerId:provider.id,source:provider.name});
    if(out.length>=40) break;
  }
  return out;
}
function upstreamBlockState(html, provider) {
  if(provider?.id==='xvideos' && /<h1>Please visit\s*<a[^>]+xvideos\.com/i.test(html)) return 'VANTAGE_BLOCKED';
  if(html.length<50000 && /cf-chl|challenge-platform|<title>Just a moment|cf-turnstile|access denied/i.test(html)) return 'VANTAGE_BLOCKED';
  return null;
}
export function parseGayPornPlanetHtml(html, provider) {
  const out=[], seen=new Set();
  for(const match of html.matchAll(/<a\b([^>]*)>/gi)) {
    const tag=match[1], href=tagAttr(tag,'href'), title=tagAttr(tag,'title').trim(), cls=tagAttr(tag,'class');
    if(!title || !/(?:^|\s)un-card-link(?:\s|$)/.test(cls) || !/^\/video\/\d+-[^/?#]+\.html$/i.test(href)) continue;
    const url=new URL(href,'https://gaypornplanet.com').href;
    if(seen.has(url)) continue;
    seen.add(url); out.push({title,url,providerId:provider.id,source:provider.name});
    if(out.length>=40) break;
  }
  return out;
}
export function parseXVideosHtml(html, provider) {
  const out=[], seen=new Set();
  const pattern=/<p\b[^>]*class=["'][^"']*\btitle\b[^"']*["'][^>]*>\s*<a\b([^>]*)>/gi;
  for(const match of html.matchAll(pattern)) {
    const tag=match[1], href=tagAttr(tag,'href'), title=tagAttr(tag,'title').trim();
    if(!title || !href || !/\/video(?:[._/]|$)/i.test(href)) continue;
    const url=new URL(href,'https://www.xvideos.com').href;
    if(seen.has(url)) continue;
    seen.add(url); out.push({title,url,providerId:provider.id,source:provider.name});
    if(out.length>=40) break;
  }
  return out;
}
async function searchProvider(provider, query, page) {
  const adapter=ADAPTERS.get(provider.id);
  if(!adapter) return {providerId:provider.id,provider:provider.name,state:'ADAPTER_UNIMPLEMENTED',results:[]};
  const requestUrl=buildProviderUrl(provider,query,page);
  const started=Date.now();
  try {
    const response=await fetchBounded(requestUrl,8000);
    if(!response.ok) return {providerId:provider.id,provider:provider.name,state:'HTTP_ERROR',httpStatus:response.status,requestUrl,finalUrl:response.url,elapsedMs:Date.now()-started,results:[]};
    const type=(response.headers.get('content-type')||'').toLowerCase();
    if(!type.includes('text/html')) return {providerId:provider.id,provider:provider.name,state:'UNEXPECTED_CONTENT',contentType:type,requestUrl,finalUrl:response.url,elapsedMs:Date.now()-started,results:[]};
    const html=await response.text();
    if(provider.id==='gaypornplanet'){const path=new URL(response.url).pathname;if(path.startsWith('/search/'))return {providerId:provider.id,provider:provider.name,state:'QUERY_FALLBACK',adapterVersion:adapter.version,requestUrl,finalUrl:response.url,elapsedMs:Date.now()-started,diagnostics:{htmlBytes:html.length},results:[]};}
    const blocked=upstreamBlockState(html,provider);
    const diagnostics={htmlBytes:html.length,thumbBlockMarkers:(html.match(/thumb-block/gi)||[]).length,titleClassMarkers:(html.match(/class=["'][^"']*\btitle\b/gi)||[]).length,thumbnailMarkers:(html.match(/class=["'][^"']*\bthumbnail\b/gi)||[]).length};
    if(blocked) return {providerId:provider.id,provider:provider.name,state:blocked,adapterVersion:adapter.version,requestUrl,finalUrl:response.url,elapsedMs:Date.now()-started,diagnostics,results:[]};
    const results=adapter.parseText(html,provider);
    return {providerId:provider.id,provider:provider.name,state:results.length?'OK':'EMPTY',adapterVersion:adapter.version,requestUrl,finalUrl:response.url,elapsedMs:Date.now()-started,diagnostics:results.length?undefined:diagnostics,results};
  } catch(error) {
    return {providerId:provider.id,provider:provider.name,state:(error?.name==='AbortError'||String(error?.message||'').toLowerCase()==='timeout')?'TIMEOUT':'NETWORK_ERROR',requestUrl,elapsedMs:Date.now()-started,diagnostics:{errorName:error?.name||'Error',errorMessage:String(error?.message||'fetch failed').slice(0,180)},results:[]};
  }
}
export async function handleRequest(request, env={}) {
  const url=new URL(request.url), origin=request.headers.get('origin')||'';
  if(request.method==='OPTIONS') return new Response(null,{status:204,headers:{...cors(origin,env),'access-control-allow-methods':'GET,OPTIONS','access-control-allow-headers':'content-type'}});
  if(request.method!=='GET') return json({error:'method_not_allowed'},405,origin,env);
  if(url.pathname==='/health') return json({ok:true,contractId:contract.contractId,schemaVersion:contract.schemaVersion,decidedProviders:contract.providers.length,edgeAdapters:[...ADAPTERS.keys()]},200,origin,env);
  if(url.pathname==='/v1/providers') return json({contractId:contract.contractId,providers:contract.providers.filter(p=>p.supportState==='SUPPORTED').map(p=>({...p,edgeAdapter:ADAPTERS.has(p.id)}))},200,origin,env);
  if(url.pathname!=='/v1/search') return json({error:'not_found'},404,origin,env);
  const query=(url.searchParams.get('q')||'').trim();
  if(!query || query.length>120) return json({error:'invalid_query'},400,origin,env);
  if(env.SEARCH_RATE_LIMITER){const limited=await env.SEARCH_RATE_LIMITER.limit({key:'v1-search'});if(!limited.success)return json({error:'rate_limited'},429,origin,env)}
  const ids=requestedProviders(url);
  if(!ids.length) return json({error:'providers_required','allowed':[...ADAPTERS.keys()]},400,origin,env);
  if(ids.length>6) return json({error:'too_many_providers',max:6},400,origin,env);
  const providers=[];
  for(const id of ids){const p=PROVIDERS.get(id);if(!p || p.supportState!=='SUPPORTED')return json({error:'provider_not_allowed',providerId:id},400,origin,env);providers.push(p)}
  const page=Math.max(1,Math.min(20,Number.parseInt(url.searchParams.get('page')||'1',10)||1));
  const reports=await Promise.all(providers.map(p=>searchProvider(p,query,page)));
  const results=[],seen=new Set();
  for(const report of reports)for(const item of report.results||[]){const key=item.url.replace(/^https?:\/\/(?:www\.)?/,'').replace(/\/$/,'');if(!seen.has(key)){seen.add(key);results.push(item)}}
  return json({query,page,contractId:contract.contractId,reports,results},200,origin,env);
}
export default {fetch: handleRequest};
