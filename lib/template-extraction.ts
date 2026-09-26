'use client';

export type TemplateApplicationMode = 'structure' | 'design' | 'both';
export type WordTemplateBranding={headerText:string;footerText:string;logoDataUrl:string};

export type DocumentTemplateProfile = {
  name:string;
  mimeType:string;
  format:'pptx'|'docx';
  sizeBytes:number;
  structure:{
    unitLabel:'slides'|'sections';
    unitCount:number;
    headings:string[];
    pattern:string;
  };
  design:{
    fontFamily:string;
    headingColor:string;
    bodyColor:string;
    backgroundColor:string;
    accentColors:string[];
    aspectRatio:string;
  };
  limitations:string;
};

const text=(value:string)=>value.replace(/\s+/g,' ').trim();
const hex=(value:string|undefined,fallback:string)=>value&&/^[0-9a-f]{6}$/i.test(value)?`#${value.toUpperCase()}`:fallback;
const attribute=(node:Element|null,name:string)=>node?.getAttribute(name)||node?.getAttribute(`a:${name}`)||node?.getAttribute(`w:${name}`)||'';
const elements=(root:Document|Element,localName:string)=>Array.from(root.getElementsByTagNameNS('*',localName));

function parseXml(xml:string){
  const parsed=new DOMParser().parseFromString(xml,'application/xml');
  if(parsed.getElementsByTagName('parsererror').length)throw new Error('The template contains unreadable XML.');
  return parsed;
}

function themeProfile(xml:string|undefined){
  if(!xml)return {fontFamily:'Arial',headingColor:'#173F4F',bodyColor:'#202020',backgroundColor:'#FFFFFF',accentColors:['#F36B4F']};
  const document=parseXml(xml);
  const detectedFont=attribute(elements(document,'latin')[0]||null,'typeface');
  const fontFamily=detectedFont&&!detectedFont.startsWith('+')?detectedFont:'Arial';
  const colour=(slot:string,fallback:string)=>{
    const node=elements(document,slot)[0];
    if(!node)return fallback;
    const colourNode=Array.from(node.children).find(child=>['srgbClr','sysClr'].includes(child.localName));
    return hex(attribute(colourNode||null,'val')||attribute(colourNode||null,'lastClr'),fallback);
  };
  const headingColor=colour('dk1','#173F4F');
  const bodyColor=colour('dk2',headingColor);
  const backgroundColor=colour('lt1','#FFFFFF');
  const accentColors=['accent1','accent2','accent3','accent4','accent5','accent6'].map((slot,index)=>colour(slot,index===0?'#F36B4F':headingColor));
  return {fontFamily,headingColor,bodyColor,backgroundColor,accentColors:[...new Set(accentColors)]};
}

async function extractPptx(file:File):Promise<DocumentTemplateProfile>{
  const JSZip=(await import('jszip')).default;
  const zip=await JSZip.loadAsync(await file.arrayBuffer());
  const slideNames=Object.keys(zip.files).filter(name=>/^ppt\/slides\/slide\d+\.xml$/.test(name)).sort((a,b)=>Number(a.match(/\d+/)?.[0]||0)-Number(b.match(/\d+/)?.[0]||0));
  if(!slideNames.length)throw new Error('No readable slides were found in this PowerPoint template.');
  const headings:string[]=[];
  for(const name of slideNames){
    const document=parseXml(await zip.files[name].async('string'));
    const candidates=elements(document,'t').map(node=>text(node.textContent||'')).filter(Boolean);
    const heading=candidates.find(value=>value.length>=3&&value.length<=120);
    if(heading)headings.push(heading);
  }
  const themeName=Object.keys(zip.files).find(name=>/^ppt\/theme\/theme\d+\.xml$/.test(name));
  const theme=themeProfile(themeName?await zip.files[themeName].async('string'):undefined);
  const presentationName=zip.files['ppt/presentation.xml'];
  let aspectRatio='Widescreen 16:9';
  if(presentationName){
    const presentation=parseXml(await presentationName.async('string'));
    const size=elements(presentation,'sldSz')[0];
    const cx=Number(attribute(size||null,'cx')),cy=Number(attribute(size||null,'cy'));
    if(cx&&cy){const ratio=cx/cy;aspectRatio=Math.abs(ratio-4/3)<.04?'Standard 4:3':Math.abs(ratio-16/9)<.05?'Widescreen 16:9':`Custom ${ratio.toFixed(2)}:1`;}
  }
  return {name:file.name,mimeType:file.type||'application/vnd.openxmlformats-officedocument.presentationml.presentation',format:'pptx',sizeBytes:file.size,structure:{unitLabel:'slides',unitCount:slideNames.length,headings:headings.slice(0,24),pattern:headings.length?`Follow the ${headings.length}-heading narrative sequence detected in the slide template.`:'Follow the detected title and content-slide sequence.'},design:{...theme,aspectRatio},limitations:'DocBeans recreates detected fonts, colours, aspect ratio and content rhythm. PowerPoint masters, animations and embedded macros are not imported.'};
}

async function extractDocx(file:File):Promise<DocumentTemplateProfile>{
  const JSZip=(await import('jszip')).default;
  const zip=await JSZip.loadAsync(await file.arrayBuffer());
  const documentPart=zip.files['word/document.xml'];
  if(!documentPart)throw new Error('No readable Word document content was found in this template.');
  const document=parseXml(await documentPart.async('string'));
  const paragraphs=elements(document,'p').map(paragraph=>{
    const value=text(elements(paragraph,'t').map(node=>node.textContent||'').join(' '));
    const style=attribute(elements(paragraph,'pStyle')[0]||null,'val');
    return {value,style};
  }).filter(item=>item.value);
  const headingParagraphs=paragraphs.filter(item=>/heading|title/i.test(item.style)).map(item=>item.value);
  const headings=(headingParagraphs.length?headingParagraphs:paragraphs.slice(0,12).map(item=>item.value)).slice(0,24);
  const themeName=Object.keys(zip.files).find(name=>/^word\/theme\/theme\d+\.xml$/.test(name));
  const theme=themeProfile(themeName?await zip.files[themeName].async('string'):undefined);
  return {name:file.name,mimeType:file.type||'application/vnd.openxmlformats-officedocument.wordprocessingml.document',format:'docx',sizeBytes:file.size,structure:{unitLabel:'sections',unitCount:Math.max(1,headings.length),headings,pattern:headingParagraphs.length?'Follow the detected Word heading hierarchy and section order.':'Use the detected paragraph sequence as the document-format reference.'},design:{...theme,aspectRatio:'Portrait document'},limitations:'DocBeans recreates detected typography, colours and heading hierarchy. Word macros, fields and page-specific floating objects are not imported.'};
}

export async function extractDocumentTemplate(file:File){
  const extension=file.name.split('.').pop()?.toLowerCase();
  if(extension==='pptx')return extractPptx(file);
  if(extension==='docx')return extractDocx(file);
  throw new Error('Upload a PowerPoint (.pptx) or Word (.docx) template.');
}

export async function extractWordTemplateBranding(file:File):Promise<WordTemplateBranding>{
  if(file.name.split('.').pop()?.toLowerCase()!=='docx')throw new Error('Upload a Word (.docx) company template.');
  const JSZip=(await import('jszip')).default;
  const zip=await JSZip.loadAsync(await file.arrayBuffer());
  const partText=async(pattern:RegExp)=>{
    const names=Object.keys(zip.files).filter(name=>pattern.test(name)).sort();
    const values:string[]=[];
    for(const name of names){const xml=await zip.files[name].async('string');const parsed=parseXml(xml);const value=text(elements(parsed,'t').map(node=>node.textContent||'').join(' '));if(value)values.push(value);}
    return values.join(' · ').slice(0,500);
  };
  const headerText=await partText(/^word\/header\d+\.xml$/i);
  const footerText=await partText(/^word\/footer\d+\.xml$/i);
  const mediaName=Object.keys(zip.files).find(name=>/^word\/media\/[^/]+\.(?:png|jpe?g|gif|webp)$/i.test(name));
  let logoDataUrl='';
  if(mediaName){const bytes=await zip.files[mediaName].async('uint8array');if(bytes.byteLength<=1_500_000){const extension=mediaName.split('.').pop()?.toLowerCase();const mime=extension==='jpg'||extension==='jpeg'?'image/jpeg':extension==='gif'?'image/gif':extension==='webp'?'image/webp':'image/png';let binary='';for(let index=0;index<bytes.length;index+=0x8000)binary+=String.fromCharCode(...bytes.subarray(index,index+0x8000));logoDataUrl=`data:${mime};base64,${btoa(binary)}`;}}
  return {headerText,footerText,logoDataUrl};
}
