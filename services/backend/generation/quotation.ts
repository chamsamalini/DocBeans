import type { GeneratedQuickDocument, GeneratedQuotation } from '../../../lib/job-generation';

const clean=(value:unknown,limit=2000)=>typeof value==='string'?value.trim().slice(0,limit):'';
const present=(value:unknown,limit=2000)=>clean(value,limit).replace(/\s*\|\s*/g,'\n').replace(/\n{3,}/g,'\n\n').trim();

export function normaliseQuotationDocument(
  document:GeneratedQuickDocument,
  input:{client:string;details:string;terms:string;preparedBy:string;requirements?:string[];clientContact?:string;supplierContact?:string;paymentTerms?:string;paymentDetails?:string;deliveryTerms?:string;exclusions?:string;acceptanceInstructions?:string},
  reference:string,
  issueDate:string,
):GeneratedQuickDocument{
  const supplied=document.quotation;
  const currency=clean(supplied?.currency,40)||extractCurrency(`${input.details}\n${input.terms}`);
  const parsedPricing=parseQuotationPricing(input.details,currency);
  const suppliedItems=(supplied?.items||[]).flatMap(item=>{
    const description=normaliseDescription(clean(item?.description,500));
    if(!description)return[];
    return[{description,quantity:clean(item.quantity,80),unitPrice:clean(item.unitPrice,120),amount:clean(item.amount,120)}];
  }).slice(0,20);
  const items=suppliedItems.length?suppliedItems:parsedPricing.items;
  const taxLabel=clean(supplied?.taxLabel,120)||extractTaxLabel(`${input.details}\n${input.terms}`);
  const acceptanceRequested=(input.requirements||[]).some(requirement=>/acceptance|signature/i.test(requirement));
  const quotation:GeneratedQuotation={
    quotationNumber:clean(supplied?.quotationNumber,80)||reference,
    issueDate:clean(supplied?.issueDate,80)||issueDate,
    validity:clean(supplied?.validity,300)||extractValidity(input.terms),
    preparedFor:clean(supplied?.preparedFor,300)||input.client,
    preparedBy:clean(supplied?.preparedBy,300)||input.preparedBy||'To be confirmed',
    clientContact:present(supplied?.clientContact,1000)||present(input.clientContact,1000),
    supplierContact:present(supplied?.supplierContact,1000)||present(input.supplierContact,1000),
    currency,
    items,
    subtotal:clean(supplied?.subtotal,120)||parsedPricing.subtotal,
    taxLabel,
    taxAmount:clean(supplied?.taxAmount,120)||(/applicable/i.test(taxLabel)?'As applicable':'Not specified'),
    total:clean(supplied?.total,120)||parsedPricing.total,
    paymentTerms:clean(supplied?.paymentTerms,1000)||clean(input.paymentTerms,1000),
    paymentDetails:clean(supplied?.paymentDetails,1500)||clean(input.paymentDetails,1500),
    deliveryTerms:clean(supplied?.deliveryTerms,1000)||clean(input.deliveryTerms,1000)||parsedPricing.deliverySummary,
    exclusions:clean(supplied?.exclusions,1000)||clean(input.exclusions,1000),
    acceptanceInstructions:clean(supplied?.acceptanceInstructions,1000)||clean(input.acceptanceInstructions,1000)||(acceptanceRequested?'Please sign and return this quotation to confirm acceptance.':''),
  };
  const localFallback=!supplied;
  const title=normaliseQuotationTitle(localFallback?quotationTitle(input.details,input.client):clean(document.title,180),input.client);
  return {...document,title,body:localFallback?'We are pleased to submit this quotation for the services detailed below.':normaliseQuotationBody(clean(document.body,3000),title),quotation};
}

function normaliseQuotationTitle(value:string,client:string){
  const title=value.replace(/\s*[-–—]\s*(?:reg(?:arding)?\.?)\s*$/i,'').trim();
  return title&&!/^(?:business|commercial)?\s*quotation$/i.test(title)?title:`Quotation for ${client}`;
}

function normaliseQuotationBody(value:string,title:string){
  return value.split(/\r?\n/).map(line=>line.trim()).filter((line,index)=>line&&!(index<3&&(/^(?:business|commercial)?\s*quotation$/i.test(line)||line.toLowerCase()===title.toLowerCase()))).join('\n').trim();
}

function extractValidity(value:string){
  const match=value.match(/\bvalid(?:ity)?(?:\s+for|\s*[:=-])?\s*([^.;\n]+)/i);
  if(match?.[1]?.trim())return match[1].trim();
  return value.match(/\b\d+\s*(?:calendar\s*)?(?:days?|weeks?|months?|years?)\b/i)?.[0]||'Not specified';
}

function extractCurrency(value:string){
  const match=value.match(/\b(SGD|USD|EUR|GBP|AUD|CAD|INR|MYR|S\$|US\$|€|£|₹)\b/i);
  return match?.[1]?.toUpperCase()||'Not specified';
}

function extractTaxLabel(value:string){
  const match=value.match(/\b(GST|VAT|sales tax)(?:\s*[:=-]\s*([^.;\n]+))?/i);
  return match?`${match[1].toUpperCase()}${match[2]?`: ${match[2].trim()}`:''}`:'Tax';
}

function quotationTitle(details:string,client:string){
  const first=details.split(/\r?\n/).map(value=>value.trim()).find(Boolean)||'';
  if(/^quotation\s+for\b/i.test(first))return first.replace(/\s*[-–—]\s*(?:reg(?:arding)?\.?)\s*$/i,'').slice(0,180);
  return `Quotation for ${client}`;
}

function parseQuotationPricing(details:string,currency:string){
  const rawLines=details.split(/\r?\n/).map(value=>value.replace(/^[•*-]\s*/, '').replace(/\s+/g,' ').trim()).filter(Boolean);
  const amountPattern=/\b(SGD|USD|EUR|GBP|AUD|CAD|INR|MYR|S\$|US\$|€|£|₹)\s*\$?\s*([\d,]+(?:\.\d{1,2})?)\s*$/i;
  const items:GeneratedQuotation['items']=[];
  const descriptionParts:string[]=[];
  let statedTotal='';
  let numericTotal=0;
  for(const line of rawLines){
    const amountMatch=line.match(amountPattern);
    if(/\b(?:grand\s+)?total(?:\s+cost)?\b/i.test(line)&&amountMatch){statedTotal=formatMoney(amountMatch[1],amountMatch[2]);continue;}
    if(amountMatch){
      const before=line.slice(0,amountMatch.index).trim();
      if(before)descriptionParts.push(before);
      while(descriptionParts.length&&/^quotation\s+for\b/i.test(descriptionParts[0]))descriptionParts.shift();
      const description=normaliseDescription(descriptionParts.join(' '));
      const amount=formatMoney(amountMatch[1],amountMatch[2]);
      if(description){items.push({description,quantity:'1',unitPrice:amount,amount});numericTotal+=moneyNumber(amountMatch[2]);}
      descriptionParts.length=0;
      continue;
    }
    descriptionParts.push(line);
  }
  if(!items.length){
    const description=normaliseDescription(rawLines.filter(line=>!/^quotation\s+for\b/i.test(line)&&!/^total\b/i.test(line)).join(' '))||'Quoted services';
    items.push({description,quantity:'1',unitPrice:'',amount:''});
  }
  const calculatedTotal=numericTotal?formatMoney(currency,String(numericTotal)):'';
  const total=statedTotal||calculatedTotal;
  return {items,subtotal:calculatedTotal||total,total,deliverySummary:items.some(item=>/\b(?:day|days|week|weeks|month|months|training|delivery)\b/i.test(item.description))?'Training duration and delivery details are stated in the itemized scope above.':''};
}

function normaliseDescription(value:string){return value.replace(/\b(\d+)\s+(st|nd|rd|th)\b/gi,'$1$2').replace(/\s+([,.;:])/g,'$1').replace(/\s+/g,' ').trim().slice(0,500);}
function moneyNumber(value:string){const parsed=Number(value.replaceAll(',',''));return Number.isFinite(parsed)?parsed:0;}
function formatMoney(currency:string,value:string){const code=currency.toUpperCase()==='S$'?'SGD':currency.toUpperCase()==='US$'?'USD':currency.toUpperCase();const number=moneyNumber(value);return `${code} ${number.toLocaleString('en-US',{minimumFractionDigits:Number.isInteger(number)?0:2,maximumFractionDigits:2})}`.trim();}
