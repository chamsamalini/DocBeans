import type { AdvancedDocument, AdvancedVisual } from './job-generation';

const wordCount = (value: string) =>
  value.trim().split(/\s+/).filter(Boolean).length;

export function visualPlanIssue(visual: AdvancedVisual) {
  if (visual.type === 'none') return '';
  if (visual.type === 'source-image')
    return wordCount(visual.description) < 6
      ? 'A source image must explain what the audience should inspect or learn.'
      : '';
  if (wordCount(visual.title) < 2 || wordCount(visual.title) > 8)
    return 'Each editable visual needs a short, specific title of two to eight words.';
  if (
    wordCount(visual.description) < 10 ||
    wordCount(visual.description) > 40
  )
    return 'Each editable visual must explain the supported relationship or decision in 10 to 40 words.';
  const minimumLabels: Partial<Record<AdvancedVisual['type'], number>> = {
    chart: 2,
    process: 3,
    timeline: 3,
    comparison: 4,
    matrix: 4,
    cycle: 4,
    architecture: 3,
    'risk-map': 4,
  };
  const minimum = minimumLabels[visual.type] || 2;
  if (visual.labels.length < minimum)
    return `The ${visual.type} visual needs at least ${minimum} meaningful labels.`;
  if (new Set(visual.labels.map((label) => label.trim().toLowerCase())).size !== visual.labels.length)
    return 'Editable visual labels must be unique.';
  return '';
}

export function proposalCoverageIssue(document: AdvancedDocument) {
  const text = document.sections
    .map(
      (section) =>
        `${section.title} ${section.summary} ${section.bullets.join(' ')}`,
    )
    .join(' ');
  const coverage = [
    ['client need or opportunity', /\b(?:need|problem|opportunity|challenge|priority|current state|business context|case for change|gap|pressure|driver|why now|pain point)\b/i],
    ['proposed solution', /\b(?:solution|proposal|approach|recommendation|program|service|offering|intervention|future state)\b/i],
    ['scope and deliverables', /\b(?:scope|deliverables?|outputs?|included|excluded|work package|boundar(?:y|ies)|responsibilit(?:y|ies)|client receives|resulting assets?)\b/i],
    ['measurable value', /\b(?:value|benefit|saving|revenue|quality|outcome|return|impact|success metric|kpi|measure|baseline|target)\b/i],
    ['delivery plan', /\b(?:implementation|timeline|milestone|phase|schedule|pilot|rollout|mobilisation|delivery plan|workplan|roadmap)\b/i],
    ['risks and assumptions', /\b(?:risks?|assumptions?|dependenc(?:y|ies)|constraints?|mitigations?|conditions?|caveats?|objections?|concerns?|contingenc(?:y|ies))\b/i],
    ['decision and next step', /\b(?:decision|approve|approval|next step|authorize|accept|proceed|commitment|sign-off|call to action)\b/i],
  ] as const;
  const missing = coverage
    .filter(([, pattern]) => !pattern.test(text))
    .map(([label]) => label);
  return missing.length
    ? `The proposal is not decision-ready because it lacks: ${missing.join(', ')}.`
    : '';
}
