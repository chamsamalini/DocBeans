'use client';

export const MAX_KNOWLEDGE_FILES=100;
export const MAX_KNOWLEDGE_FILE_BYTES=50*1024*1024;
const DB_NAME='docbeans-knowledge-cache';
const STORE_NAME='source-chunks';
const CHUNK_CHARACTERS=2_500;
const CHUNK_OVERLAP=200;
const MAX_CONTEXT_CHARACTERS=300_000;
const CACHE_TTL_MS=24*60*60*1000;

type ChunkRecord={id:number;chunks:string[];expiresAt:number};
type RetrievalSource={id:number;name:string;kind:'text'|'image'|'website';content:string;url?:string};

function database(){
  return new Promise<IDBDatabase>((resolve,reject)=>{const request=indexedDB.open(DB_NAME,1);request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains(STORE_NAME))request.result.createObjectStore(STORE_NAME,{keyPath:'id'});};request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error||new Error('Local knowledge storage could not be opened.'));});
}

function splitContent(content:string){
  const compact=content.replace(/\u0000/g,'').replace(/[ \t]+\n/g,'\n').replace(/\n{4,}/g,'\n\n\n').trim();const chunks:string[]=[];let start=0;
  while(start<compact.length){let end=Math.min(compact.length,start+CHUNK_CHARACTERS);if(end<compact.length){const boundary=compact.lastIndexOf('\n',end);if(boundary>start+CHUNK_CHARACTERS*.65)end=boundary;}const chunk=compact.slice(start,end).trim();if(chunk)chunks.push(chunk);if(end>=compact.length)break;start=Math.max(start+1,end-CHUNK_OVERLAP);}
  return chunks;
}

async function transact<T>(mode:IDBTransactionMode,run:(store:IDBObjectStore,resolve:(value:T)=>void,reject:(reason?:unknown)=>void)=>void){const db=await database();return await new Promise<T>((resolve,reject)=>{const transaction=db.transaction(STORE_NAME,mode);run(transaction.objectStore(STORE_NAME),resolve,reject);transaction.oncomplete=()=>db.close();transaction.onerror=()=>reject(transaction.error);});}

export async function storeKnowledgeContent(id:number,content:string){
  const chunks=splitContent(content);await transact<void>('readwrite',(store,resolve,reject)=>{const request=store.put({id,chunks,expiresAt:Date.now()+CACHE_TTL_MS} satisfies ChunkRecord);request.onsuccess=()=>resolve();request.onerror=()=>reject(request.error);});return chunks.length;
}

export async function removeKnowledgeContent(id:number){try{await transact<void>('readwrite',(store,resolve,reject)=>{const request=store.delete(id);request.onsuccess=()=>resolve();request.onerror=()=>reject(request.error);});}catch{}}

async function chunksFor(source:RetrievalSource){
  try{return await transact<string[]>('readonly',(store,resolve,reject)=>{const request=store.get(source.id);request.onsuccess=()=>{const record=request.result as ChunkRecord|undefined;resolve(record&&record.expiresAt>Date.now()?record.chunks:splitContent(source.content));};request.onerror=()=>reject(request.error);});}catch{return splitContent(source.content);}
}

function queryTerms(value:string){return [...new Set((value.toLowerCase().match(/[a-z0-9]{3,}/g)||[]).filter(term=>!['the','and','for','with','from','this','that','into','your','should','document'].includes(term)))].slice(0,80);}

export async function retrieveKnowledgeExcerpts(sources:RetrievalSource[],query:string){
  const terms=queryTerms(query);const candidates:{source:RetrievalSource;chunk:string;score:number;index:number}[]=[];
  for(const source of sources){if(source.kind==='image')continue;const chunks=await chunksFor(source);const ranked=chunks.map((chunk,index)=>{const lower=chunk.toLowerCase();const score=terms.reduce((total,term)=>total+(lower.includes(term)?1+(lower.match(new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}`, 'g'))?.length||0):0),0)+(index===0?.25:0);return{source,chunk,score,index};}).sort((a,b)=>b.score-a.score||a.index-b.index).slice(0,4);candidates.push(...ranked);}
  const selected=new Map<number,string[]>();let used=0;
  for(const source of sources.filter(item=>item.kind!=='image')){const best=candidates.filter(item=>item.source.id===source.id).sort((a,b)=>b.score-a.score||a.index-b.index)[0];if(best&&used+best.chunk.length<=MAX_CONTEXT_CHARACTERS){selected.set(source.id,[best.chunk]);used+=best.chunk.length;}}
  for(const candidate of candidates.sort((a,b)=>b.score-a.score||a.index-b.index)){if(used+candidate.chunk.length>MAX_CONTEXT_CHARACTERS)continue;const current=selected.get(candidate.source.id)||[];if(current.includes(candidate.chunk)||current.length>=4)continue;current.push(candidate.chunk);selected.set(candidate.source.id,current);used+=candidate.chunk.length;}
  return sources.flatMap(source=>{if(source.kind==='image')return[source];const chunks=selected.get(source.id);return chunks?.length?[{...source,content:chunks.join('\n\n[Relevant excerpt]\n\n')}]:[];});
}
