import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const schemaFiles = [
  'services/backend/generation/advanced-service.ts',
  'services/backend/generation/course-plan.ts',
  'services/backend/generation/job-service.ts',
];

const violations = [];

for (const file of schemaFiles) {
  const source = readFileSync(resolve(file), 'utf8');
  for (const match of source.matchAll(/minItems\s*:\s*(\d+)/g)) {
    const value = Number(match[1]);
    if (value > 1) violations.push(`${file}: minItems ${value}`);
  }
  for (const match of source.matchAll(/maxItems\s*:/g)) {
    violations.push(`${file}: maxItems is not supported`);
  }
}

if (violations.length) {
  console.error('Anthropic structured-output schema incompatibilities:');
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log('Provider schema compatibility check passed.');
