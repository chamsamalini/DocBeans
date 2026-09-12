import { env } from 'cloudflare:workers';
import { getDocBeansUser } from '@/lib/supabase/server';
import type { GenerationUsage, QuickGenerationResponse } from '@/lib/job-generation';

type Provider = 'anthropic' | 'openai';
const DOCBEANS_PRICE_SGD = 0.03;
const PROVIDERS = {
  anthropic:{ defaultModel:'claude-sonnet-5', models:{ 'claude-sonnet-5':{input:2,output:10}, 'claude-haiku-4-5':{input:1,output:5} } },
  openai:{ defaultModel:'gpt-5-mini', models:{ 'gpt-5-mini':{input:.25,output:2}, 'gpt-4.1-mini':{input:.4,output:1.6} } },
} as const;
const documentTypes = new Set(['appreciation','recommendation','testimonial','thank-you','cover-letter','quotation','proposal','project-brief','executive-summary','curriculum','memo','announcement','meeting-agenda','meeting-minutes','sop','leave','medical-leave']);
const schema = { type:'object', additionalProperties:false, required:['title','body'], properties:{ title:{type:'string'}, body:{type:'string'} } } as const;

function clean(value:unknown, limit=5000) { return typeof value === 'string' ? value.trim().slice(0,limit) : ''; }
function select(payload:Record<string,unknown>) {
  const provider:Provider = payload.provider === 'openai' ? 'openai' : 'anthropic';
  const config = PROVIDERS[provider];
  const rates = config.models as Record<string,{input:number;output:number}>;
  const requested = clean(payload.model,100);
  const model = requested in rates ? requested : config.defaultModel;
  return {provider,model,rates:rates[model]};
}
function keyFor(provider:Provider, request:Request) {
  const supplied = request.headers.get('X-Provider-API-Key')?.trim();
  if (supplied) return supplied;
  try {
    const workerEnv = env as unknown as {ANTHROPIC_API_KEY?:string;OPENAI_API_KEY?:string};
    return provider === 'anthropic' ? workerEnv.ANTHROPIC_API_KEY : workerEnv.OPENAI_API_KEY;
  } catch {}
  return provider === 'anthropic' ? process.env.ANTHROPIC_API_KEY : process.env.OPENAI_API_KEY;
}
function outputText(raw:Record<string,unknown>, provider:Provider) {
  if (provider === 'openai' && typeof raw.output_text === 'string') return raw.output_text;
  const blocks = provider === 'anthropic' ? raw.content : raw.output;
  for (const block of Array.isArray(blocks) ? blocks : []) {
    if (!block || typeof block !== 'object') continue;
    if (typeof (block as {text?:unknown}).text === 'string') return (block as {text:string}).text;
    for (const part of Array.isArray((block as {content?:unknown}).content) ? (block as {content:unknown[]}).content : []) {
      if (part && typeof part === 'object' && typeof (part as {text?:unknown}).text === 'string') return (part as {text:string}).text;
    }
  }
  return '';
}
function fallback(payload:Record<string,unknown>) {
  const primary=clean(payload.primary,500), details=clean(payload.details), secondary=clean(payload.secondary,1000), sender=clean(payload.sender,300);
  return { title:primary || 'Untitled document', body:[details,secondary,sender && `From: ${sender}`].filter(Boolean).join('\n\n') };
}
function usage(mode:GenerationUsage['mode'], model:string, raw:Record<string,unknown>, rates:{input:number;output:number}, isByok=false):GenerationUsage {
  const value=(raw.usage||{}) as {input_tokens?:number;output_tokens?:number;cache_read_input_tokens?:number;input_tokens_details?:{cached_tokens?:number}};
  const inputTokens=value.input_tokens||0, outputTokens=value.output_tokens||0, cachedInputTokens=value.cache_read_input_tokens||value.input_tokens_details?.cached_tokens||0;
  return { mode, billingMode:mode==='local-fallback'?'none':isByok?'byok':'managed', model, responseId:typeof raw.id==='string'?raw.id:null, inputTokens, outputTokens, cachedInputTokens, totalTokens:inputTokens+outputTokens+cachedInputTokens, providerCostUsd:(inputTokens*rates.input+outputTokens*rates.output)/1_000_000, credits:mode==='local-fallback'||isByok?0:1, customerChargeSgd:mode==='local-fallback'||isByok?0:DOCBEANS_PRICE_SGD };
}

export async function POST(request:Request) {
  if (!await getDocBeansUser()) return Response.json({error:'Sign in to generate a document.'},{status:401});
  const requestId=crypto.randomUUID();
  const payload=await request.json().catch(()=>null) as Record<string,unknown>|null;
  if (!payload || !documentTypes.has(clean(payload.documentType,80)) || !clean(payload.primary) || !clean(payload.details)) return Response.json({error:'Document type and required details are missing.'},{status:400,headers:{'X-Request-ID':requestId}});
  const {provider,model,rates}=select(payload);
  const isByok=request.headers.get('X-DocBeans-Billing-Mode')==='byok' && Boolean(request.headers.get('X-Provider-API-Key')?.trim());
  const key=keyFor(provider,request);
  if (!key) {
    const result:QuickGenerationResponse={document:fallback(payload),usage:usage('local-fallback','Local document rules',{},rates),notice:`${provider==='anthropic'?'Anthropic':'OpenAI'} is not configured. Add a BYOK key in AI settings or configure a managed key.`};
    return Response.json(result,{headers:{'X-Request-ID':requestId}});
  }
  const brief={documentType:clean(payload.documentType,80),recipientOrSubject:clean(payload.primary,500),details:clean(payload.details),additionalContext:clean(payload.secondary,1000),preparedBy:clean(payload.sender,300),tone:clean(payload.tone,120)};
  const system='You are DocBeans, a careful professional document writer. Create the requested document in polished, natural language. Preserve supplied names, dates, amounts and facts. Do not invent claims, diagnoses, prices, credentials, policies or commitments. Match the requested document type and tone. Return a concise title and complete plain-text body. Use short headings and bullet characters only where they improve the document. Do not repeat the title in the body.';
  const response=provider==='anthropic' ? await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'x-api-key':key,'anthropic-version':'2023-06-01','Content-Type':'application/json'},body:JSON.stringify({model,max_tokens:3000,system,messages:[{role:'user',content:JSON.stringify(brief)}],output_config:{format:{type:'json_schema',schema}}})}) : await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify({model,max_output_tokens:3000,input:[{role:'system',content:system},{role:'user',content:JSON.stringify(brief)}],text:{format:{type:'json_schema',name:'document',strict:true,schema}}})});
  const raw=await response.json() as Record<string,unknown>;
  if (!response.ok) {
    const message=raw.error&&typeof raw.error==='object'&&typeof (raw.error as {message?:unknown}).message==='string'?(raw.error as {message:string}).message:'The generation provider could not complete this request.';
    console.error(JSON.stringify({service:'docbeans-generation',event:'generation_failed',requestId,mode:provider,model,providerStatus:response.status,reason:'provider_error'}));
    return Response.json({error:message},{status:502,headers:{'X-Request-ID':requestId}});
  }
  const text=outputText(raw,provider);
  try {
    const document=JSON.parse(text) as {title:string;body:string};
    const result:QuickGenerationResponse={document,usage:usage(provider,typeof raw.model==='string'?raw.model:model,raw,rates,isByok),notice:isByok?'BYOK generation: your AI provider bills this model usage directly. No DocBeans AI credit was consumed.':undefined};
    return Response.json(result,{headers:{'X-Request-ID':requestId}});
  } catch {
    console.error(JSON.stringify({service:'docbeans-generation',event:'generation_failed',requestId,mode:provider,model,stopReason:raw.stop_reason||raw.status,outputCharacters:text.length,reason:'invalid_provider_json'}));
    return Response.json({error:'The selected model did not finish a valid document. Please try again.'},{status:502,headers:{'X-Request-ID':requestId}});
  }
}
