import JSZip from 'jszip';

const MASTER_OVERRIDE = /<Override\s+PartName="\/ppt\/slideMasters\/(slideMaster\d+\.xml)"\s+ContentType="application\/vnd\.openxmlformats-officedocument\.presentationml\.slideMaster\+xml"\s*\/>/g;

/**
 * PptxGenJS can declare one slide master per slide while writing only the first
 * master. PowerPoint often repairs that package silently, but stricter readers
 * reject it. Remove dangling declarations, add any missing declarations, and
 * verify every retained master target before the file is offered for download.
 */
export async function repairAndValidatePptxPackage(input:Blob):Promise<Blob>{
  const zip=await JSZip.loadAsync(await input.arrayBuffer());
  const contentTypesEntry=zip.file('[Content_Types].xml');
  if(!contentTypesEntry)throw new Error('The presentation package is missing [Content_Types].xml.');

  let contentTypes=await contentTypesEntry.async('string');
  contentTypes=contentTypes.replace(MASTER_OVERRIDE,(declaration,fileName)=>zip.file(`ppt/slideMasters/${fileName}`)?declaration:'');

  const declared=new Set<string>();
  for(const match of contentTypes.matchAll(MASTER_OVERRIDE))declared.add(match[1]);
  const actual=Object.keys(zip.files)
    .map(name=>name.match(/^ppt\/slideMasters\/(slideMaster\d+\.xml)$/)?.[1])
    .filter((name):name is string=>Boolean(name));
  for(const fileName of actual){
    if(declared.has(fileName))continue;
    const declaration=`<Override PartName="/ppt/slideMasters/${fileName}" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>`;
    contentTypes=contentTypes.replace('</Types>',`${declaration}</Types>`);
  }
  zip.file('[Content_Types].xml',contentTypes);

  const repaired=await zip.generateAsync({type:'blob',mimeType:'application/vnd.openxmlformats-officedocument.presentationml.presentation',compression:'DEFLATE'});
  const check=await JSZip.loadAsync(await repaired.arrayBuffer());
  const checkedTypes=await check.file('[Content_Types].xml')!.async('string');
  for(const match of checkedTypes.matchAll(MASTER_OVERRIDE)){
    if(!check.file(`ppt/slideMasters/${match[1]}`))throw new Error(`The presentation references a missing slide master: ${match[1]}.`);
  }
  if(!check.file('ppt/presentation.xml')||!check.file('ppt/slides/slide1.xml'))throw new Error('The presentation package is incomplete.');
  return repaired;
}
