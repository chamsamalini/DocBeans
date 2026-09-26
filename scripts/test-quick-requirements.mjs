import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const page=readFileSync(new URL('../app/create/page.tsx',import.meta.url),'utf8');
const quickService=readFileSync(new URL('../services/backend/generation/quick-service.ts',import.meta.url),'utf8');
const jobService=readFileSync(new URL('../services/backend/generation/job-service.ts',import.meta.url),'utf8');
const types=['appreciation','recommendation','testimonial','thank-you','cover-letter','job-description','quotation','proposal','project-brief','executive-summary','curriculum','sop','memo','announcement','meeting-agenda','meeting-minutes','leave','medical-leave'];
const start=page.indexOf('const quickRequirementSuggestions');
const end=page.indexOf('const initialQuickRequirements',start);
assert.ok(start>=0&&end>start,'Quick requirement catalogue must be present.');
const catalogue=page.slice(start,end);
for(const type of types){
  const key=type.includes('-')?`'${type}'`:`${type}`;
  assert.match(catalogue,new RegExp(`${key.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}\\s*:\\s*\\[`),`Missing requirement set for ${type}.`);
}
for(const marker of ['Document requirements','Select all that apply and add your own requirement','quick-custom-requirement','quickRequirements.length === 0','requirements: quickRequirements'])assert.ok(page.includes(marker),`Quick requirement UI marker missing: ${marker}`);
for(const marker of ['requirements(payload.requirements)','acceptance criterion'])assert.ok(quickService.includes(marker),`Quick generator requirement marker missing: ${marker}`);
for(const marker of ['source.requirements','document requirement as an acceptance criterion'])assert.ok(jobService.includes(marker),`Job generator requirement marker missing: ${marker}`);

console.log(`Quick-document requirements verified for ${types.length} document types.`);
