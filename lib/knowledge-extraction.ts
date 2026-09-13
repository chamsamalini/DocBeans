'use client';

export type ExtractedKnowledge = {
  content:string;
  mimeType:string;
  dataUrl?:string;
  kind:'text'|'image';
};

const TEXT_LIMIT = 60_000;

function compact(value:string) {
  return value.replace(/\u0000/g,'').replace(/[ \t]+\n/g,'\n').replace(/\n{4,}/g,'\n\n\n').trim().slice(0,TEXT_LIMIT);
}

async function dataUrl(file:File) {
  return await new Promise<string>((resolve,reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error || new Error('The file could not be read.'));
    reader.readAsDataURL(file);
  });
}

async function extractPdf(buffer:ArrayBuffer) {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/legacy/build/pdf.worker.min.mjs', import.meta.url).toString();
  const document = await pdfjs.getDocument({ data:new Uint8Array(buffer) }).promise;
  const pages:string[] = [];
  for (let index=1; index<=Math.min(document.numPages,80); index+=1) {
    const page = await document.getPage(index);
    const text = await page.getTextContent();
    pages.push(text.items.map(item => 'str' in item ? item.str : '').join(' '));
  }
  return pages.join('\n\n');
}

async function extractPptx(buffer:ArrayBuffer) {
  const JSZip = (await import('jszip')).default;
  const zip = await JSZip.loadAsync(buffer);
  const names = Object.keys(zip.files).filter(name => /^ppt\/slides\/slide\d+\.xml$/.test(name)).sort((a,b) => Number(a.match(/\d+/)?.[0]||0)-Number(b.match(/\d+/)?.[0]||0));
  const slides:string[] = [];
  for (const name of names) {
    const xml = await zip.files[name].async('string');
    const parsed = new DOMParser().parseFromString(xml,'application/xml');
    slides.push(Array.from(parsed.getElementsByTagNameNS('*','t')).map(node => node.textContent || '').join(' | '));
  }
  return slides.map((slide,index)=>`Slide ${index+1}: ${slide}`).join('\n\n');
}

export async function extractKnowledgeFile(file:File):Promise<ExtractedKnowledge> {
  if (file.size > 8 * 1024 * 1024) throw new Error('Use a file smaller than 8 MB.');
  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  const mimeType = file.type || 'application/octet-stream';
  if (mimeType.startsWith('image/') || ['png','jpg','jpeg','webp','gif'].includes(extension)) {
    return { content:`Image source: ${file.name}`, mimeType:mimeType.startsWith('image/')?mimeType:'image/jpeg', dataUrl:await dataUrl(file), kind:'image' };
  }
  if (['txt','md','csv','json'].includes(extension) || mimeType.startsWith('text/')) return { content:compact(await file.text()), mimeType, kind:'text' };
  const buffer = await file.arrayBuffer();
  if (extension === 'docx') {
    const mammoth = await import('mammoth/mammoth.browser');
    return { content:compact((await mammoth.extractRawText({arrayBuffer:buffer})).value), mimeType, kind:'text' };
  }
  if (extension === 'pdf') return { content:compact(await extractPdf(buffer)), mimeType, kind:'text' };
  if (extension === 'pptx') return { content:compact(await extractPptx(buffer)), mimeType, kind:'text' };
  if (['xlsx','xls'].includes(extension)) {
    const XLSX = await import('xlsx');
    const workbook = XLSX.read(buffer,{type:'array'});
    const content = workbook.SheetNames.map(name=>`Sheet: ${name}\n${XLSX.utils.sheet_to_csv(workbook.Sheets[name])}`).join('\n\n');
    return { content:compact(content), mimeType, kind:'text' };
  }
  throw new Error('Supported files are PDF, DOCX, PPTX, XLSX, TXT, CSV, JSON and common images.');
}
