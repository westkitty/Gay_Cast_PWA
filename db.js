const DB_NAME='gaycast-pwa';
const DB_VERSION=2;
const STORES=['media','collections','creators','savedSearches','inbox','settings'];
let dbPromise;
function openDb(){
  if(dbPromise)return dbPromise;
  dbPromise=new Promise((resolve,reject)=>{
    const req=indexedDB.open(DB_NAME,DB_VERSION);
    req.onupgradeneeded=()=>{
      const db=req.result;
      if(!db.objectStoreNames.contains('media')){const s=db.createObjectStore('media',{keyPath:'id'});s.createIndex('addedAt','addedAt');s.createIndex('title','title');}
      if(!db.objectStoreNames.contains('collections'))db.createObjectStore('collections',{keyPath:'id'});
      if(!db.objectStoreNames.contains('creators'))db.createObjectStore('creators',{keyPath:'id'});
      if(!db.objectStoreNames.contains('savedSearches'))db.createObjectStore('savedSearches',{keyPath:'id'});
      if(!db.objectStoreNames.contains('inbox'))db.createObjectStore('inbox',{keyPath:'id'});
      if(!db.objectStoreNames.contains('settings'))db.createObjectStore('settings',{keyPath:'key'});
    };
    req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
  });
  return dbPromise;
}
async function tx(store,mode='readonly'){return (await openDb()).transaction(store,mode).objectStore(store)}
export async function getAll(store){const s=await tx(store);return new Promise((res,rej)=>{const r=s.getAll();r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})}
export async function getOne(store,key){const s=await tx(store);return new Promise((res,rej)=>{const r=s.get(key);r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})}
export async function put(store,value){const s=await tx(store,'readwrite');return new Promise((res,rej)=>{const r=s.put(value);r.onsuccess=()=>res(value);r.onerror=()=>rej(r.error)})}
export async function del(store,key){const s=await tx(store,'readwrite');return new Promise((res,rej)=>{const r=s.delete(key);r.onsuccess=()=>res();r.onerror=()=>rej(r.error)})}
export async function clearStore(store){const s=await tx(store,'readwrite');return new Promise((res,rej)=>{const r=s.clear();r.onsuccess=()=>res();r.onerror=()=>rej(r.error)})}
export async function exportDb(){const out={version:2,exportedAt:new Date().toISOString(),stores:{}};for(const name of STORES)out.stores[name]=await getAll(name);return out}
export async function importDb(payload){if(!payload||typeof payload!=='object'||!payload.stores)throw new Error('Invalid GayCast backup');for(const name of STORES){if(!Array.isArray(payload.stores[name]))continue;await clearStore(name);for(const item of payload.stores[name])await put(name,item)}}
export {STORES};
