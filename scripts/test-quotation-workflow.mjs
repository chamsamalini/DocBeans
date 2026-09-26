import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { normaliseQuotationDocument } from '../services/backend/generation/quotation.ts';

const normalised=normaliseQuotationDocument({
  title:'Quotation for ISO 9001 Internal Staff Training',
  body:'We are pleased to provide this quotation.',
  quotation:{
    quotationNumber:'',issueDate:'',validity:'30 days',preparedFor:'ABC Company',preparedBy:'Petreltech',clientContact:'Procurement Lead\nprocurement@example.com',supplierContact:'Petreltech\nhello@example.com',currency:'SGD',
    items:[{description:'ISO 9001 training for internal staff',quantity:'5 days',unitPrice:'',amount:'1,500'}],
    subtotal:'1,500',taxLabel:'GST applicable',taxAmount:'',total:'1,500 plus applicable GST',paymentTerms:'Full payment before training begins.',paymentDetails:'Bank transfer to the account stated on the invoice; quote the quotation number.',deliveryTerms:'Five days of instructor-led training.',exclusions:'',acceptanceInstructions:'Sign and return this quotation.',
  },
},{client:'ABC Company',details:'ISO 9001 training for internal staff\nTotal cost: 1,500\nGST: Applicable',terms:'SGD. GST applicable. Valid 30 days.',preparedBy:'Petreltech',paymentTerms:'Full payment before training begins.',paymentDetails:'Bank transfer to the account stated on the invoice; quote the quotation number.'},'DBQ-20260917-ABC123','2026-09-17');

assert.equal(normalised.quotation?.quotationNumber,'DBQ-20260917-ABC123','A quotation must receive a stable document reference when the provider leaves it blank.');
assert.equal(normalised.quotation?.items[0].description,'ISO 9001 training for internal staff','The itemized service description must be preserved.');
assert.equal(normalised.quotation?.taxLabel,'GST applicable','Tax wording must be preserved without inventing a rate.');
assert.equal(normalised.quotation?.taxAmount,'As applicable','The workflow must disclose applicable tax without inventing a rate.');
assert.equal(normalised.quotation?.paymentTerms,'Full payment before training begins.','Payment timing must remain separate from remittance instructions.');
assert.match(normalised.quotation?.paymentDetails||'',/Bank transfer/,'Payment method and remittance details must be preserved.');

const fallback=normaliseQuotationDocument({title:'',body:''},{client:'ABC Company',details:'Custom workshop',terms:'',preparedBy:''},'DBQ-1','2026-09-17');
assert.equal(fallback.quotation?.items.length,1,'Local fallback must still produce an itemized quotation structure.');
assert.equal(fallback.quotation?.preparedBy,'To be confirmed','Missing supplier identity must be disclosed rather than invented.');
assert.equal(fallback.quotation?.currency,'Not specified','Missing currency must be disclosed rather than guessed.');

const trainingBrief=`Quotation for API Q1, API 6A, 16A, 17D, & 16C Training - Reg
API Q1 – 10th Edition – Training
3 days Training & 1 day Foundation and 1 day Practitioner
training
USD 6,000
Training Course Quote for API Q1 - 10th Edition Internal
Auditor Training (2-Day Program)
USD 2,400
API 6A – 21st Edition – Training – 3 days training USD 4,050
API 16A – 4
th Edition – Training – 3 days training USD 4,050
API 17D – 3
rd Edition – Training – 3 days training USD 4,050
API 16C – 3
rd Edition – Training – 3 days training USD 4,050
Total Cost for the training USD 24,600`;
const parsedTraining=normaliseQuotationDocument({title:'Sri Energy India Pte Ltd',body:`${trainingBrief}\n\nRequirements to address:`},{client:'Sri Energy India Pte Ltd',details:trainingBrief,terms:'USD, 30 days',preparedBy:'ABC',requirements:['Present itemized scope, quantity, price and total clearly','Keep tax, validity, payment and delivery terms explicit','Include acceptance instructions and signature fields'],paymentTerms:'50% advance, 50% upon project completion.',paymentDetails:'Bank transfer details supplied separately.'},'DBQ-TRAINING','2026-09-18');
assert.equal(parsedTraining.quotation?.items.length,6,'Wrapped training lines must be reconstructed into six priced items.');
assert.equal(parsedTraining.quotation?.items[0].amount,'USD 6,000','The first wrapped price must remain attached to its course.');
assert.match(parsedTraining.quotation?.items[2].description,/API 6A/,'Each API course must receive its own line item.');
assert.equal(parsedTraining.quotation?.subtotal,'USD 24,600','The itemized subtotal must be calculated only from supplied prices.');
assert.equal(parsedTraining.quotation?.total,'USD 24,600','The stated total must be preserved.');
assert.equal(parsedTraining.quotation?.validity,'30 days','Plain duration wording must be recognised as quotation validity.');
assert.equal(parsedTraining.quotation?.taxAmount,'Not specified','Missing tax treatment must be disclosed.');
assert.match(parsedTraining.quotation?.deliveryTerms||'',/itemized scope/i,'Supplied training durations must be acknowledged in delivery terms.');
assert.match(parsedTraining.quotation?.acceptanceInstructions||'',/sign and return/i,'A selected acceptance requirement must produce usable instructions.');
assert.doesNotMatch(parsedTraining.body,/Requirements to address/i,'Internal generation requirements must never appear in client-facing copy.');
assert.match(parsedTraining.title,/API Q1/i,'The quotation subject must be used instead of only the client name.');
const repairedProviderCopy=normaliseQuotationDocument({title:'BUSINESS QUOTATION',body:'BUSINESS QUOTATION\nQuotation for Client\nThank you for the opportunity.',quotation:{...parsedTraining.quotation,preparedFor:'Client',preparedBy:'Supplier',items:[{description:'API 16A – 4 th Edition – Training',quantity:'1',unitPrice:'USD 4,050',amount:'USD 4,050'}]}},{client:'Client',details:'API 16A – 4th Edition – Training USD 4,050',terms:'USD, valid 30 days',preparedBy:'Supplier'},'DBQ-REPAIR','2026-09-18');
assert.equal(repairedProviderCopy.title,'Quotation for Client','A generic provider title must be replaced with a client-facing title.');
assert.equal(repairedProviderCopy.quotation?.items[0].description,'API 16A – 4th Edition – Training','Split ordinal suffixes must be repaired before export.');
assert.doesNotMatch(repairedProviderCopy.body,/BUSINESS QUOTATION/i,'Duplicate generic headings must be removed from the quotation body.');
const contactFormatting=normaliseQuotationDocument({title:'',body:''},{client:'Client',details:'Service USD 100',terms:'USD, 30 days',preparedBy:'Supplier',clientContact:'Line one | Line two |'},'DBQ-CONTACT','2026-09-18');
assert.equal(contactFormatting.quotation?.clientContact,'Line one\nLine two','Imported address separators must render as professional line breaks.');

const service=readFileSync(new URL('../services/backend/generation/quick-service.ts',import.meta.url),'utf8');
const page=readFileSync(new URL('../app/create/page.tsx',import.meta.url),'utf8');
for(const marker of ['quotationSchema','normaliseQuotationDocument','Never invent prices','Separate subtotal, tax and total','Keep payment terms','paymentDetails'])assert.ok(service.includes(marker),`Quotation service marker missing: ${marker}`);
for(const marker of ['GeneratedQuotationPreview','QuotationTemplateUploader','buildQuotationDocx','assertQuotationExportReady','extractWordTemplateBranding','quotation-template-letterhead','Company template logo','Company quotation template','original Word package and visible letterhead retained','Upload company template','Optional quotation details not supplied','optional when shown on the template','Quotation no.','Unit price','Authorized signature','Payment method and remittance details','documentType === \'quotation\''])assert.ok(page.includes(marker),`Quotation layout marker missing: ${marker}`);

console.log('Structured quotation generation and layout tests passed.');
