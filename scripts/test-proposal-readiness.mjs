import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const page = await readFile(
  new URL('../app/create/page.tsx', import.meta.url),
  'utf8',
);
const service = await readFile(
  new URL('../services/backend/generation/advanced-service.ts', import.meta.url),
  'utf8',
);

const requiredFields = [
  'clientNeed',
  'proposedSolution',
  'scopeDeliverables',
  'measurableValue',
  'deliveryPlan',
  'risksAssumptions',
  'decisionNextStep',
];

for (const field of requiredFields) {
  assert.match(page, new RegExp(`["']${field}["']`));
  assert.match(service, new RegExp(`${field}:clean`));
}

assert.match(page, /Proposal readiness/);
assert.match(page, /will\s+not spend provider tokens/);
assert.match(page, /missingProposalDetails\.length > 0/);
assert.match(page, /proposalDetails:\s*isProposalBrief/);
assert.match(service, /Complete the proposal brief before generation/);
assert.match(service, /No provider request was made/);
assert.ok(
  service.indexOf('if(missingProposalInputs.length)') <
    service.indexOf('const {provider,model,rates}=providerSelection'),
  'proposal readiness must be checked before provider setup or calls',
);
assert.match(service, /proposalMode\?\{proposalDetails\}:\{\}/);

console.log('Proposal requirement-gathering and preflight checks passed.');
