import {DB_NAME,DB_VERSION,USER_STORES,upgradeDatabase} from './db-schema.mjs';
let dbPromise;
function openDb(){
  if(dbPromise)return dbPromise;
  dbPromise=new Promise((resolve,reject)=>{
    const req=indexedDB.open(DB_NAME,DB_VERSION);
    req.onupgradeneeded=()=>upgradeDatabase(req.result);
    req.onsuccess=()=>resolve(req.result);
    req.onerror=()=>reject(req.error);
  });
  return dbPromise;
}
async function tx(store,mode='readonly'){return (await openDb()).transaction(store,mode).objectStore(store)}
export async function getAll(store){const s=await tx(store);return new Promise((res,rej)=>{const r=s.getAll();r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})}
export async function getOne(store,key){const s=await tx(store);return new Promise((res,rej)=>{const r=s.get(key);r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})}
export async function put(store,value){const s=await tx(store,'readwrite');return new Promise((res,rej)=>{const r=s.put(value);r.onsuccess=()=>res(value);r.onerror=()=>rej(r.error)})}
export async function del(store,key){const s=await tx(store,'readwrite');return new Promise((res,rej)=>{const r=s.delete(key);r.onsuccess=()=>res();r.onerror=()=>rej(r.error)})}
export async function clearStore(store){const s=await tx(store,'readwrite');return new Promise((res,rej)=>{const r=s.clear();r.onsuccess=()=>res();r.onerror=()=>rej(r.error)})}
export async function exportDb(){const out={version:DB_VERSION,exportedAt:new Date().toISOString(),stores:{}};for(const name of USER_STORES)out.stores[name]=await getAll(name);return out}
export async function importDb(payload){if(!payload||typeof payload!=='object'||!payload.stores)throw new Error('Invalid GayCast backup');for(const name of USER_STORES){if(!Array.isArray(payload.stores[name]))continue;await clearStore(name);for(const item of payload.stores[name])await put(name,item)}}
export {USER_STORES as STORES,openDb};
