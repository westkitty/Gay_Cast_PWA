import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SEARCH_SNAPSHOT_SCHEMA_VERSION,
  SEARCH_CACHE_MAX_QUERIES,
  normalizeBrokerResponse,
  normalizeProviderIds,
  normalizeQuery,
  providerSetKey,
  snapshotKey,
  trimSnapshots,
  validateSnapshot
} from '../../search-contract.mjs';
import {DB_VERSION,upgradeDatabase} from '../../db-schema.mjs';

test('query normalization is exact and whitespace/case stable',()=>{assert.equal(normalizeQuery('  Bear   DADDY  '),'bear daddy');assert.notEqual(normalizeQuery('bear daddy'),normalizeQuery('bear daddies'))});
test('provider set keys are order-independent but exact',()=>{assert.deepEqual(normalizeProviderIds(['b','a','a']),['a','b']);assert.equal(providerSetKey(['b','a']),'a,b');assert.notEqual(providerSetKey(['a','b']),providerSetKey(['a','c']))});
test('snapshot key requires exact normalized query and provider set',()=>{assert.equal(snapshotKey(' Bear ',['b','a']),snapshotKey('bear',['a','b']));assert.notEqual(snapshotKey('bear',['a','b']),snapshotKey('bear',['a']));assert.notEqual(snapshotKey('bear',['a']),snapshotKey('bears',['a']))});
test('snapshot validation rejects stale and incompatible schema records',()=>{const now=Date.now(),base={id:'x',schemaVersion:SEARCH_SNAPSHOT_SCHEMA_VERSION,normalizedQuery:'bear',providerSetKey:'a',capturedAt:now,results:[],reports:[]};assert.equal(validateSnapshot(base,now),true);assert.equal(validateSnapshot({...base,schemaVersion:999},now),false);assert.equal(validateSnapshot({...base,capturedAt:now-31*24*60*60*1000},now),false)});
test('cache eviction keeps only newest compatible bounded snapshots',()=>{const now=Date.now();const records=Array.from({length:SEARCH_CACHE_MAX_QUERIES+5},(_,i)=>({id:String(i),schemaVersion:SEARCH_SNAPSHOT_SCHEMA_VERSION,normalizedQuery:`q${i}`,providerSetKey:'a',capturedAt:now-i,results:[],reports:[]}));const kept=trimSnapshots(records,now);assert.equal(kept.length,SEARCH_CACHE_MAX_QUERIES);assert.equal(kept[0].id,'0');assert.equal(kept.at(-1).id,String(SEARCH_CACHE_MAX_QUERIES-1))});
test('broker normalization drops untrusted-provider result data',()=>{const body={contractId:'gaycast-provider-contract',query:'bear',reports:[{providerId:'ok',state:'OK',results:[1]},{providerId:'bad',state:'QUERY_FALLBACK',results:[]}],results:[{providerId:'ok',title:'Good',url:'https://example.com/a'},{providerId:'bad',title:'Bad',url:'https://example.com/b'}]};const normalized=normalizeBrokerResponse(body);assert.equal(normalized.results.length,1);assert.equal(normalized.results[0].providerId,'ok');assert.equal(normalized.reports[1].trusted,false)});
test('database v3 migration only creates missing stores and preserves existing user stores',()=>{assert.equal(DB_VERSION,3);const existing=new Set(['media','collections','creators','savedSearches','inbox','settings']);const created=[];const fake={objectStoreNames:{contains:name=>existing.has(name)||created.some(item=>item.name===name)},createObjectStore(name,options){const record={name,options,indexes:[]};created.push(record);return {createIndex:(index,key)=>record.indexes.push([index,key])}}};upgradeDatabase(fake);assert.deepEqual(created.map(item=>item.name),['searchSnapshots','providerObservations']);assert.equal(existing.size,6);assert.deepEqual(created[0].indexes,[['capturedAt','capturedAt']]);assert.deepEqual(created[1].indexes,[['observedAt','observedAt']])});
