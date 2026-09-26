import assert from 'node:assert/strict';
import { validationRecoveryAdvice } from '../lib/generation-recovery.ts';
import {
  inferSourceReferences,
  PASTED_KNOWLEDGE_REFERENCE,
} from '../lib/source-trace.ts';

assert.deepEqual(
  inferSourceReferences('Revenue grew 18 percent.', [
    {
      name: PASTED_KNOWLEDGE_REFERENCE,
      content: 'Revenue grew 18 percent in the approved period.',
    },
  ]),
  [PASTED_KNOWLEDGE_REFERENCE],
);

assert.deepEqual(
  inferSourceReferences('Retention reached 92 percent.', [
    { name: 'finance.docx', content: 'Revenue and operating margin.' },
    { name: 'customers.pdf', content: 'Customer retention reached 92 percent.' },
  ]),
  ['customers.pdf'],
);

assert.match(
  validationRecoveryAdvice(
    'One or more factual sections lack a traceable approved filename or website URL.',
    'presentation',
    false,
  ),
  /approved source or pasted knowledge/i,
);
assert.doesNotMatch(
  validationRecoveryAdvice(
    'One or more factual sections lack a traceable approved filename or website URL.',
    'presentation',
    false,
  ),
  /increase the slide count/i,
);
assert.match(
  validationRecoveryAdvice(
    'The provider returned slide content that is too dense for a readable presentation.',
    'presentation',
    false,
  ),
  /increase the slide count/i,
);

console.log('Source trace and recovery-advice checks passed.');
