function decodeEntities(value='') {
  return value.replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>');
}
function tagAttr(tag,name) {
  const match=tag.match(new RegExp(`\\b${name}\\s*=\\s*(["'])(.*?)\\1`,'i'));
  return match?decodeEntities(match[2]):'';
}
export function buildProviderUrl(provider, query, page=1) {
  if(!provider?.searchTemplate)throw new Error('provider has no search template');
  const encoded=encodeURIComponent(query.trim()).replace(/%20/g,'+');
  const n=provider.pagination==='ZERO_BASED_QUERY_PAGE'?Math.max(0,page-1):Math.max(1,page);
  return provider.searchTemplate.replaceAll('{query}',encoded).replaceAll('{page}',String(n));
}
function pushResult(out,seen,provider,title,href,base) {
  const url=new URL(href,base).href;
  if(seen.has(url))return;
  seen.add(url);
  out.push({title,url,providerId:provider.id,source:provider.name});
}
export function parseBarebackBastardsHtml(html,provider) {
  const out=[],seen=new Set();
  const pattern=/<a\b([^>]*\bclass=["'][^"']*\bthumbnail\b[^"']*["'][^>]*)>/gi;
  for(const match of html.matchAll(pattern)){
    const tag=match[1],href=tagAttr(tag,'href'),title=tagAttr(tag,'title').trim();
    if(!title||!/^\/\d+\/[a-z0-9][^?#]*\/?$/i.test(href))continue;
    pushResult(out,seen,provider,title,href,'https://barebackbastards.com');
    if(out.length>=40)break;
  }
  return out;
}
export function parseMachoTubeHtml(html,provider) {
  const out=[],seen=new Set();
  for(const match of html.matchAll(/<a\b([^>]*)>/gi)){
    const tag=match[1],href=tagAttr(tag,'href'),title=tagAttr(tag,'title').trim(),cls=tagAttr(tag,'class');
    if(!title||!/(?:^|\s)js-gallery-link(?:\s|$)/.test(cls)||!/^\/movies\/\d+\/[a-z0-9][^?#]*$/i.test(href))continue;
    if(href.includes('${')||title.includes('${'))continue;
    pushResult(out,seen,provider,title,href,'https://www.machotube.tv');
    if(out.length>=40)break;
  }
  return out;
}
export function parseGayPornArchiveHtml(html,provider) {
  const out=[],seen=new Set();
  for(const match of html.matchAll(/<a\b([^>]*)>/gi)){
    const tag=match[1],href=tagAttr(tag,'href'),title=tagAttr(tag,'title').trim(),cls=tagAttr(tag,'class'),gallery=tagAttr(tag,'data-gallery-id');
    if(!title||!/(?:^|\s)js-gallery-link(?:\s|$)/.test(cls)||!/^\d+$/.test(gallery)||!/^\/\d+\/[a-z0-9][^?#]*\/$/i.test(href))continue;
    if(href.includes('${')||title.includes('${'))continue;
    pushResult(out,seen,provider,title,href,'https://gaypornarchive.com');
    if(out.length>=40)break;
  }
  return out;
}
export function parseGayPornPlanetHtml(html,provider) {
  const out=[],seen=new Set();
  for(const match of html.matchAll(/<a\b([^>]*)>/gi)){
    const tag=match[1],href=tagAttr(tag,'href'),title=tagAttr(tag,'title').trim(),cls=tagAttr(tag,'class');
    if(!title||!/(?:^|\s)un-card-link(?:\s|$)/.test(cls)||!/^\/video\/\d+-[^/?#]+\.html$/i.test(href))continue;
    pushResult(out,seen,provider,title,href,'https://gaypornplanet.com');
    if(out.length>=40)break;
  }
  return out;
}
export function parseSunPornoHtml(html,provider) {
  const out=[],seen=new Set();
  for(const match of html.matchAll(/<a\b([^>]*)>/gi)){
    const tag=match[1],href=tagAttr(tag,'href'),title=tagAttr(tag,'title').trim(),cls=tagAttr(tag,'class');
    if(!title||!/(?:^|\s)item(?:\s|$)/.test(cls)||!/^https?:\/\/(?:www\.)?sunporno\.com\/v\/\d+\/[^?#]+\/?$/i.test(href))continue;
    const cleanTitle=title.replace(/^Porn Videos/i,'').trim();
    if(!cleanTitle)continue;
    pushResult(out,seen,provider,cleanTitle,href,'https://www.sunporno.com');
    if(out.length>=40)break;
  }
  return out;
}
export function parseXVideosHtml(html,provider) {
  const out=[],seen=new Set();
  const pattern=/<p\b[^>]*class=["'][^"']*\btitle\b[^"']*["'][^>]*>\s*<a\b([^>]*)>/gi;
  for(const match of html.matchAll(pattern)){
    const tag=match[1],href=tagAttr(tag,'href'),title=tagAttr(tag,'title').trim();
    if(!title||!href||!/\/video(?:[._/]|$)/i.test(href))continue;
    pushResult(out,seen,provider,title,href,'https://www.xvideos.com');
    if(out.length>=40)break;
  }
  return out;
}
function queryTitleEvidence(results,query) {
  const tokens=(query.toLowerCase().match(/[a-z0-9]{3,}/g)||[]);
  return Boolean(tokens.length&&results.some(item=>tokens.some(token=>item.title.toLowerCase().includes(token))));
}
function adapter(spec) {
  return Object.freeze({
    ...spec,
    buildUrl:spec.buildUrl||buildProviderUrl,
    evaluate:spec.evaluate||(()=>({state:'OK'}))
  });
}
export const ADAPTERS=new Map([
  ['gaypornarchive',adapter({
    id:'gaypornarchive',version:'gaypornarchive-edge-v2',parse:parseGayPornArchiveHtml,
    evaluate:({results,query})=>results.length&&!queryTitleEvidence(results,query)?{state:'QUERY_FALLBACK',reason:'Parsed listing did not contain query evidence.'}:{state:results.length?'OK':'EMPTY'}
  })],
  ['gaypornplanet',adapter({
    id:'gaypornplanet',version:'gaypornplanet-edge-v2',parse:parseGayPornPlanetHtml,
    evaluate:({response,results})=>new URL(response.url).pathname.startsWith('/search/')?{state:'QUERY_FALLBACK',reason:'Provider remained on its generic search route instead of a query-specific result route.'}:{state:results.length?'OK':'EMPTY'}
  })],
  ['machotube',adapter({
    id:'machotube',version:'machotube-edge-v2',parse:parseMachoTubeHtml,
    evaluate:({results,query})=>results.length&&!queryTitleEvidence(results,query)?{state:'QUERY_FALLBACK',reason:'Parsed listing did not contain query evidence.'}:{state:results.length?'OK':'EMPTY'}
  })],
  ['sunporno',adapter({
    id:'sunporno',version:'sunporno-edge-v2',parse:parseSunPornoHtml,
    statusState:response=>response.status===404?{state:'EMPTY',reason:'Provider returned a query-specific 404 with no results.'}:null,
    evaluate:({results})=>({state:results.length?'OK':'EMPTY'})
  })]
]);
