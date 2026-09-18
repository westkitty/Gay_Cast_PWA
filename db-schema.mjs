export const DB_NAME='gaycast-pwa';
export const DB_VERSION=3;
export const USER_STORES=['media','collections','creators','savedSearches','inbox','settings'];
export const CACHE_STORES=['searchSnapshots','providerObservations'];
export const ALL_STORES=[...USER_STORES,...CACHE_STORES];

export function upgradeDatabase(db) {
  if(!db.objectStoreNames.contains('media')){
    const store=db.createObjectStore('media',{keyPath:'id'});
    store.createIndex('addedAt','addedAt');
    store.createIndex('title','title');
  }
  if(!db.objectStoreNames.contains('collections'))db.createObjectStore('collections',{keyPath:'id'});
  if(!db.objectStoreNames.contains('creators'))db.createObjectStore('creators',{keyPath:'id'});
  if(!db.objectStoreNames.contains('savedSearches'))db.createObjectStore('savedSearches',{keyPath:'id'});
  if(!db.objectStoreNames.contains('inbox'))db.createObjectStore('inbox',{keyPath:'id'});
  if(!db.objectStoreNames.contains('settings'))db.createObjectStore('settings',{keyPath:'key'});
  if(!db.objectStoreNames.contains('searchSnapshots')){
    const store=db.createObjectStore('searchSnapshots',{keyPath:'id'});
    store.createIndex('capturedAt','capturedAt');
  }
  if(!db.objectStoreNames.contains('providerObservations')){
    const store=db.createObjectStore('providerObservations',{keyPath:'providerId'});
    store.createIndex('observedAt','observedAt');
  }
}
