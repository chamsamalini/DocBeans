import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  DEFAULT_PRESENTATION_SLIDES,
  normalisePresentationSlideCount,
  presentationContentSlideCount,
  recommendedPresentationOutputTokens,
} from '../lib/presentation-planning.ts';

assert.equal(normalisePresentationSlideCount(undefined), DEFAULT_PRESENTATION_SLIDES);
assert.equal(normalisePresentationSlideCount(3), 5);
assert.equal(normalisePresentationSlideCount(18.6), 19);
assert.equal(normalisePresentationSlideCount(80), 30);
assert.equal(presentationContentSlideCount(12), 11);

const tenSlideBudget = recommendedPresentationOutputTokens({
  slideCount: 10,
  sourceCount: 2,
  requirementCount: 4,
  visuals: true,
});
const twentySlideBudget = recommendedPresentationOutputTokens({
  slideCount: 20,
  sourceCount: 2,
  requirementCount: 4,
  visuals: true,
});
assert.ok(twentySlideBudget > tenSlideBudget);

const page = await readFile(new URL('../app/create/page.tsx', import.meta.url), 'utf8');
const service = await readFile(
  new URL('../services/backend/generation/advanced-service.ts', import.meta.url),
  'utf8',
);

assert.match(page, /How many slides should the presentation contain\?/);
assert.match(page, /presentationSlideCount:\s*advancedType === 'presentation'/);
assert.match(page, /Use one clear audience-facing message per slide/);
assert.match(page, /Use assertion-evidence titles that state each slide takeaway/);
assert.match(service, /exactly \$\{presentationSlideCount\} total slides/);
assert.match(service, /document\.sections\.length!==presentationContentSlideCount/);

console.log('Presentation slide-count workflow checks passed.');
