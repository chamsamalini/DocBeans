'use client';

import JSZip from 'jszip';

const DOCX_MIME='application/vnd.openxmlformats-officedocument.wordprocessingml.document';

function body(xml:string){
  const match=xml.match(/<w:body(?:\s[^>]*)?>([\s\S]*?)<\/w:body>/i);
  if(!match)throw new Error('The Word template does not contain a readable document body.');
  return {full:match[0],inner:match[1]};
}

function sectionProperties(value:string){
  return value.match(/<w:sectPr(?:\s[^>]*)?>[\s\S]*?<\/w:sectPr>/i)?.[0]||value.match(/<w:sectPr(?:\s[^>]*)?\/>/i)?.[0]||'';
}

function bodyBranding(value:string){
  const children:string[]=[];
  const token=/<\/?w:(p|tbl|sdt)\b[^>]*>/gi;
  let depth=0,start=-1,match:RegExpExecArray|null;
  while((match=token.exec(value))){const closing=match[0].startsWith('</');if(!closing&&depth===0)start=match.index;depth+=closing?-1:1;if(depth===0&&start>=0){const child=value.slice(start,token.lastIndex);if(/<(?:w:drawing|w:pict|v:shape|v:imagedata|a:blip)\b/i.test(child))children.push(child);start=-1;}}
  return children.join('');
}

const retainedPackageParts=(zip:JSZip)=>Object.keys(zip.files).filter(name=>!zip.files[name].dir&&/^(?:word\/(?:header|footer)\d+\.xml|word\/media\/|word\/_rels\/document\.xml\.rels$)/i.test(name));

export async function validateWordQuotationPackage(blob:Blob,expectedTemplateParts:string[]=[]){
  const zip=await JSZip.loadAsync(await blob.arrayBuffer());
  const documentPart=zip.file('word/document.xml');
  if(!documentPart)throw new Error('The quotation package is missing its main Word document part.');
  const documentXml=await documentPart.async('string');
  const tableCount=(documentXml.match(/<w:tbl\b/gi)||[]).length;
  if(tableCount<3)throw new Error('The quotation export is incomplete: its commercial tables were not created.');
  if(!/Scope and pricing/i.test(documentXml)||!/Commercial terms/i.test(documentXml))throw new Error('The quotation export is incomplete: required commercial sections are missing.');
  for(const name of expectedTemplateParts){if(!zip.file(name))throw new Error(`The company template part ${name} was lost during export.`);}
  return {tableCount,retainedTemplateParts:expectedTemplateParts.filter(name=>Boolean(zip.file(name))).length};
}

export async function applyWordQuotationTemplate(template:Blob,generated:Blob){
  const [templateZip,generatedZip]=await Promise.all([JSZip.loadAsync(await template.arrayBuffer()),JSZip.loadAsync(await generated.arrayBuffer())]);
  const expectedTemplateParts=retainedPackageParts(templateZip);
  const templatePart=templateZip.file('word/document.xml');
  const generatedPart=generatedZip.file('word/document.xml');
  if(!templatePart||!generatedPart)throw new Error('The Word template or generated quotation is missing its main document part.');
  const [templateXml,generatedXml]=await Promise.all([templatePart.async('string'),generatedPart.async('string')]);
  const templateBody=body(templateXml),generatedBody=body(generatedXml);
  const templateSection=sectionProperties(templateBody.inner);
  const retainedBodyBranding=bodyBranding(templateBody.inner);
  const generatedSection=sectionProperties(generatedBody.inner);
  const generatedContent=generatedBody.inner.replace(/<w:sectPr(?:\s[^>]*)?>[\s\S]*?<\/w:sectPr>/gi,'').replace(/<w:sectPr(?:\s[^>]*)?\/>/gi,'').trim();
  const mergedBody=`<w:body>${retainedBodyBranding}${generatedContent}${templateSection||generatedSection}</w:body>`;
  templateZip.file('word/document.xml',templateXml.replace(templateBody.full,mergedBody));
  const output=await templateZip.generateAsync({type:'blob',mimeType:DOCX_MIME,compression:'DEFLATE'});
  await validateWordQuotationPackage(output,expectedTemplateParts);
  return output;
}
