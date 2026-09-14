import { getAuthenticatedUser } from '@/services/auth/server';

const MAX_RESPONSE_BYTES=2_000_000;
const MAX_SOURCE_CHARACTERS=60_000;
const REDIRECT_STATUSES=new Set([301,302,303,307,308]);

function privateHostname(hostname:string){
  const host=hostname.toLowerCase().replace(/^\[|\]$/g,'');
  if(host==='localhost'||host.endsWith('.localhost')||host.endsWith('.local')||host.endsWith('.internal')||host==='metadata.google.internal')return true;
  const ipv4=host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if(ipv4){const octets=ipv4.slice(1).map(Number);if(octets.some(value=>value>255))return true;const [a,b]=octets;return a===0||a===10||a===127||a>=224||(a===100&&b>=64&&b<=127)||(a===169&&b===254)||(a===172&&b>=16&&b<=31)||(a===192&&b===168)||(a===198&&(b===18||b===19));}
  if(host.includes(':')){if(host==='::'||host==='::1'||host.startsWith('fc')||host.startsWith('fd')||/^fe[89ab]/.test(host))return true;const mapped=host.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/)?.[1];if(mapped)return privateHostname(mapped);}
  return false;
}

function publicUrl(value:unknown){
  if(typeof value!=='string'||value.length>2_000)throw new Error('Enter a valid public website URL.');
  let url:URL;try{url=new URL(value.trim());}catch{throw new Error('Enter a complete website URL beginning with https:// or http://.');}
  if(!['https:','http:'].includes(url.protocol)||url.username||url.password||privateHostname(url.hostname))throw new Error('Only public HTTP or HTTPS website URLs can be fetched.');
  if(url.port&&!['80','443'].includes(url.port))throw new Error('This website uses a port that DocBeans does not fetch.');
  url.hash='';return url;
}

async function readLimited(response:Response){
  const declared=Number(response.headers.get('content-length')||0);if(declared>MAX_RESPONSE_BYTES)throw new Error('This website page is too large to use as a source.');
  if(!response.body)return '';
  const reader=response.body.getReader();const decoder=new TextDecoder();let bytes=0,text='';
  while(true){const {done,value}=await reader.read();if(done)break;bytes+=value.byteLength;if(bytes>MAX_RESPONSE_BYTES){await reader.cancel();throw new Error('This website page is too large to use as a source.');}text+=decoder.decode(value,{stream:true});}
  return text+decoder.decode();
}

function decodeEntities(value:string){return value.replace(/&#(\d+);/g,(_,code)=>String.fromCodePoint(Number(code))).replace(/&#x([0-9a-f]+);/gi,(_,code)=>String.fromCodePoint(Number.parseInt(code,16))).replace(/&nbsp;/gi,' ').replace(/&amp;/gi,'&').replace(/&lt;/gi,'<').replace(/&gt;/gi,'>').replace(/&quot;/gi,'"').replace(/&#39;|&apos;/gi,"'");}
function htmlText(html:string){return decodeEntities(html.replace(/<!--[\s\S]*?-->/g,' ').replace(/<(script|style|noscript|svg|canvas|template)[^>]*>[\s\S]*?<\/\1>/gi,' ').replace(/<\/?(?:p|div|section|article|main|header|footer|aside|nav|h[1-6]|li|tr|br|hr)[^>]*>/gi,'\n').replace(/<[^>]+>/g,' ')).replace(/[\t\f\v ]+/g,' ').replace(/\n\s*\n+/g,'\n').trim().slice(0,MAX_SOURCE_CHARACTERS);}

async function fetchPublicPage(initial:URL){
  let url=initial;
  for(let redirects=0;redirects<=3;redirects++){
    const response=await fetch(url,{redirect:'manual',headers:{Accept:'text/html,application/xhtml+xml,text/plain;q=0.9','User-Agent':'DocBeans/1.0 source-fetcher'}});
    if(REDIRECT_STATUSES.has(response.status)){const location=response.headers.get('location');if(!location)throw new Error('The website returned an invalid redirect.');url=publicUrl(new URL(location,url).toString());continue;}
    if(!response.ok)throw new Error(`The website returned HTTP ${response.status}.`);
    const contentType=(response.headers.get('content-type')||'').toLowerCase();if(!contentType.includes('text/html')&&!contentType.includes('application/xhtml+xml')&&!contentType.includes('text/plain'))throw new Error('This URL does not return a readable web page.');
    const raw=await readLimited(response);const titleMatch=raw.match(/<title[^>]*>([\s\S]*?)<\/title>/i);const content=contentType.includes('text/plain')?raw.trim().slice(0,MAX_SOURCE_CHARACTERS):htmlText(raw);if(content.length<80)throw new Error('No usable page content was found at this URL.');
    const title=titleMatch?htmlText(titleMatch[1]).slice(0,160):url.hostname;return {url:url.toString(),title:title||url.hostname,content};
  }
  throw new Error('The website redirected too many times.');
}

export async function fetchApprovedWebsite(request:Request){
  if(!await getAuthenticatedUser())return Response.json({error:'Sign in to fetch a website source.'},{status:401});
  const payload=await request.json().catch(()=>null) as {url?:unknown}|null;
  try{
    const page=await fetchPublicPage(publicUrl(payload?.url));
    return Response.json({source:{name:page.title,meta:`Website · ${page.content.length.toLocaleString()} characters extracted`,mimeType:'text/html',kind:'website',content:page.content,url:page.url}});
  }catch(error){return Response.json({error:error instanceof Error?error.message:'DocBeans could not fetch this website.'},{status:400});}
}
