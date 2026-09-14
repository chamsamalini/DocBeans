'use client';

const DB_NAME = 'docbeans-advanced-drafts';
const STORE_NAME = 'drafts';
const CURRENT_DRAFT = 'current';
const DRAFT_TTL_MS = 24 * 60 * 60 * 1000;

type DraftRecord<T> = {
  id:string;
  value:T;
  expiresAt:number;
};

function database() {
  return new Promise<IDBDatabase>((resolve,reject)=>{
    const request=indexedDB.open(DB_NAME,1);
    request.onupgradeneeded=()=>{
      if(!request.result.objectStoreNames.contains(STORE_NAME)) request.result.createObjectStore(STORE_NAME,{keyPath:'id'});
    };
    request.onsuccess=()=>resolve(request.result);
    request.onerror=()=>reject(request.error||new Error('The document draft could not be opened.'));
  });
}

export async function saveAdvancedBriefDraft<T>(value:T) {
  if(typeof indexedDB==='undefined') return;
  const db=await database();
  await new Promise<void>((resolve,reject)=>{
    const transaction=db.transaction(STORE_NAME,'readwrite');
    const request=transaction.objectStore(STORE_NAME).put({id:CURRENT_DRAFT,value,expiresAt:Date.now()+DRAFT_TTL_MS} satisfies DraftRecord<T>);
    request.onerror=()=>reject(request.error);
    transaction.oncomplete=()=>{db.close();resolve();};
    transaction.onerror=()=>{db.close();reject(transaction.error);};
  });
}

export async function loadAdvancedBriefDraft<T>() {
  if(typeof indexedDB==='undefined') return null;
  const db=await database();
  return await new Promise<T|null>((resolve,reject)=>{
    const transaction=db.transaction(STORE_NAME,'readwrite');
    const store=transaction.objectStore(STORE_NAME);
    const request=store.get(CURRENT_DRAFT);
    request.onsuccess=()=>{
      const record=request.result as DraftRecord<T>|undefined;
      if(!record||record.expiresAt<=Date.now()) {
        if(record) store.delete(CURRENT_DRAFT);
        resolve(null);
        return;
      }
      resolve(record.value);
    };
    request.onerror=()=>reject(request.error);
    transaction.oncomplete=()=>db.close();
    transaction.onerror=()=>{db.close();reject(transaction.error);};
  });
}
