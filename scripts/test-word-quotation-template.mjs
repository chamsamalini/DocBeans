import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import JSZip from 'jszip';
import { Document, Footer, Header, ImageRun, Packer, Paragraph, TextRun } from 'docx';
import { buildQuotationDocx, quotationExportProblems } from '../lib/quotation-docx.ts';
import { validateWordQuotationPackage } from '../lib/word-template-application.ts';

const pixel=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZQmcAAAAASUVORK5CYII=','base64');
const template=new Document({sections:[{
  properties:{page:{margin:{top:900,right:1000,bottom:900,left:1000,header:420,footer:420}}},
  headers:{default:new Header({children:[new Paragraph({children:[new ImageRun({data:pixel,transformation:{width:28,height:28},type:'png'}),new TextRun({text:'  COMPANY LETTERHEAD',bold:true})]})]})},
  footers:{default:new Footer({children:[new Paragraph('Company registration and contact details')]})},
  children:[new Paragraph({children:[new ImageRun({data:pixel,transformation:{width:24,height:24},type:'png'})]}),new Paragraph('REMOVE SAMPLE BODY')],
}]});
const templateBlob=await Packer.toBlob(template);
const quotation={title:'Quotation for API Standards Training',body:'We are pleased to submit this quotation for the training services described below.',quotation:{
  quotationNumber:'DBQ-20260918-TEST',issueDate:'18 September 2026',validity:'30 days',preparedFor:'Sri Energy India Pte Ltd',preparedBy:'Example Training Pte Ltd',clientContact:'Procurement Team',supplierContact:'training@example.com',currency:'USD',
  items:[
    {description:'API Q1 – 10th Edition – five-day training programme',quantity:'1',unitPrice:'USD 6,000',amount:'USD 6,000'},
    {description:'API Q1 – 10th Edition Internal Auditor Training – two-day programme',quantity:'1',unitPrice:'USD 2,400',amount:'USD 2,400'},
    {description:'API 6A – 21st Edition – three-day training',quantity:'1',unitPrice:'USD 4,050',amount:'USD 4,050'},
    {description:'API 16A – 4th Edition – three-day training',quantity:'1',unitPrice:'USD 4,050',amount:'USD 4,050'},
    {description:'API 17D – 3rd Edition – three-day training',quantity:'1',unitPrice:'USD 4,050',amount:'USD 4,050'},
    {description:'API 16C – 3rd Edition – three-day training',quantity:'1',unitPrice:'USD 4,050',amount:'USD 4,050'},
  ],
  subtotal:'USD 24,600',taxLabel:'GST',taxAmount:'As applicable',total:'USD 24,600',paymentTerms:'50% on acceptance; balance due before delivery.',paymentDetails:'Bank transfer instructions will be provided on the invoice.',deliveryTerms:'Instructor-led training according to the itemized duration and agreed schedule.',exclusions:'Travel, venue and accommodation are excluded unless agreed in writing.',acceptanceInstructions:'Sign and return this quotation to confirm acceptance.',
}};

assert.deepEqual(quotationExportProblems(quotation),[],'A complete structured quotation must pass the export gate.');
assert.match(quotationExportProblems({title:'Business quotation',body:'Plain paragraphs only'})[0],/structured quotation data/i,'A generic fallback must be rejected.');

const output=await buildQuotationDocx(quotation,{fontFamily:'Arial',headingColor:'#173F4F',bodyColor:'#202020',templateFile:templateBlob});
const merged=await JSZip.loadAsync(await output.arrayBuffer());
const documentXml=await merged.file('word/document.xml').async('string');
const expectedTemplateParts=Object.keys(merged.files).filter(name=>!merged.files[name].dir&&/^(?:word\/(?:header|footer)\d+\.xml|word\/media\/)/i.test(name));
const verification=await validateWordQuotationPackage(output,expectedTemplateParts);
assert.ok(verification.tableCount>=5,'The quotation must contain metadata, pricing, totals, terms and acceptance tables.');
assert.doesNotMatch(documentXml,/REMOVE SAMPLE BODY/,'Template sample body must be removed.');
assert.match(documentXml,/Quotation for API Standards Training/,'The specific quotation title must be inserted.');
assert.match(documentXml,/API 16A – 4th Edition/,'Ordinal text must remain intact in one line item.');
assert.match(documentXml,/Scope and pricing/,'The pricing section must be present.');
assert.match(documentXml,/Commercial terms/,'The commercial terms section must be present.');
assert.ok(Object.keys(merged.files).some(name=>/^word\/header\d+\.xml$/i.test(name)),'The template header must remain in the output package.');
assert.ok(Object.keys(merged.files).some(name=>/^word\/footer\d+\.xml$/i.test(name)),'The template footer must remain in the output package.');
assert.ok(Object.keys(merged.files).some(name=>/^word\/media\//i.test(name)),'The template logo/media must remain in the output package.');

if(process.env.DOCBEANS_QUOTATION_TEST_OUTPUT){
  await mkdir(dirname(process.env.DOCBEANS_QUOTATION_TEST_OUTPUT),{recursive:true});
  await writeFile(process.env.DOCBEANS_QUOTATION_TEST_OUTPUT,Buffer.from(await output.arrayBuffer()));
}
console.log('Word quotation template preservation and export quality tests passed.');
