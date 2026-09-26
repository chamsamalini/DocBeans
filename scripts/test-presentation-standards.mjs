import assert from 'node:assert/strict';
import {
  proposalCoverageIssue,
  visualPlanIssue,
} from '../lib/presentation-standards.ts';

const visual = {
  type: 'matrix',
  title: 'Pilot decision matrix',
  description:
    'The matrix compares business value with delivery risk to determine which use cases enter the pilot.',
  sourceName: '',
  labels: ['High value', 'Low value', 'High risk', 'Low risk'],
  values: [],
};
assert.equal(visualPlanIssue(visual), '');
assert.match(
  visualPlanIssue({ ...visual, description: 'Four labels.' }),
  /explain the supported relationship/i,
);
assert.match(
  visualPlanIssue({ ...visual, labels: ['Value', 'Risk'] }),
  /at least 4 meaningful labels/i,
);

const proposal = {
  title: 'Client proposal',
  subtitle: '',
  sections: [
    {
      title: 'Client opportunity',
      summary: 'The current process creates a measurable quality and cycle-time problem.',
      bullets: ['The proposed solution addresses the documented need.'],
      instructionalPurpose: 'explain',
      timingMinutes: 3,
      facilitatorNotes: [],
      visual: { ...visual, type: 'none', labels: [] },
      sourceRefs: [],
    },
    {
      title: 'Scope and delivery',
      summary: 'The scope defines deliverables, implementation phases and timeline milestones.',
      bullets: ['Benefits and expected outcomes provide measurable value.'],
      instructionalPurpose: 'apply',
      timingMinutes: 3,
      facilitatorNotes: [],
      visual: { ...visual, type: 'none', labels: [] },
      sourceRefs: [],
    },
    {
      title: 'Risk and decision',
      summary: 'Assumptions, dependencies and risk mitigation support the approval decision.',
      bullets: ['The next step is to authorize the pilot.'],
      instructionalPurpose: 'decide',
      timingMinutes: 3,
      facilitatorNotes: [],
      visual: { ...visual, type: 'none', labels: [] },
      sourceRefs: [],
    },
  ],
  sourcesUsed: [],
  requirementCoverage: [],
  quality: { score: 90, status: 'ready', checks: [], missingInformation: [] },
};
assert.equal(proposalCoverageIssue(proposal), '');
assert.match(
  proposalCoverageIssue({ ...proposal, sections: proposal.sections.slice(0, 1) }),
  /not decision-ready/i,
);

const equivalentBusinessLanguage = {
  ...proposal,
  sections: [
    {
      ...proposal.sections[0],
      title: 'Why change now',
      summary: 'Business context and a documented gap establish the case for change.',
      bullets: ['The recommended future state is the preferred intervention.'],
    },
    {
      ...proposal.sections[1],
      title: 'Boundaries and roadmap',
      summary: 'Responsibilities and resulting assets are delivered through a phased roadmap.',
      bullets: ['Success metrics and targets define the expected impact.'],
    },
    {
      ...proposal.sections[2],
      title: 'Concerns and sign-off',
      summary: 'Dependencies, caveats and contingencies address likely objections.',
      bullets: ['Proceed through formal sign-off as the immediate call to action.'],
    },
  ],
};
assert.equal(proposalCoverageIssue(equivalentBusinessLanguage), '');

console.log('Presentation and proposal quality-standard checks passed.');
