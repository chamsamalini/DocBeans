import assert from 'node:assert/strict';
import { compactPresentationDensity } from '../lib/presentation-density.ts';

const long = (prefix, count) =>
  `${prefix} ${Array.from({ length: count }, (_, index) => `word${index + 1}`).join(' ')}`;
const document = {
  title: 'Test presentation',
  subtitle: '',
  sections: [
    {
      title: long('A direct but unnecessarily long presentation title', 12),
      summary: long('The approved evidence supports the central conclusion', 30),
      bullets: Array.from({ length: 7 }, (_, index) =>
        long(`Evidence point ${index + 1}`, 22),
      ),
      instructionalPurpose: 'explain',
      timingMinutes: 3,
      facilitatorNotes: [],
      visual: {
        type: 'none',
        title: '',
        description: '',
        sourceName: '',
        labels: [],
        values: [],
      },
      sourceRefs: ['approved.pdf'],
    },
  ],
  sourcesUsed: ['approved.pdf'],
  requirementCoverage: [],
  quality: { score: 90, status: 'ready', checks: [], missingInformation: [] },
};

assert.equal(compactPresentationDensity(document), true);
const [section] = document.sections;
assert.ok(section.title.split(/\s+/).length <= 8);
assert.ok(section.summary.split(/\s+/).length <= 24);
assert.ok(section.bullets.length <= 4);
assert.ok(section.bullets.every((bullet) => bullet.split(/\s+/).length <= 16));
assert.ok(section.facilitatorNotes.some((note) => note.startsWith('Full original title:')));
assert.ok(section.facilitatorNotes.some((note) => note.startsWith('Extended explanation:')));
assert.ok(section.facilitatorNotes.some((note) => note.startsWith('Extended evidence:')));
assert.ok(section.facilitatorNotes.some((note) => note.startsWith('Additional evidence:')));
assert.deepEqual(section.sourceRefs, ['approved.pdf']);

console.log('Deterministic presentation-density repair checks passed.');
