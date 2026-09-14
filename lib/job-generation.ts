export type JobPostInput = {
  title: string;
  context: string;
  organisation: string;
  companyUrl: string;
  responsibilities: string;
  qualifications: string;
  preferredQualifications: string;
  benefits: string;
  application: string;
  tone: string;
};

export type QualityCheck = {
  label: string;
  status: 'pass' | 'review';
  message: string;
};

export type GeneratedJobDocument = {
  title: string;
  context: string;
  organisation: string;
  companyUrl: string;
  aboutRole: string;
  responsibilities: string[];
  requiredQualifications: string[];
  preferredQualifications: string[];
  benefits: string[];
  application: string;
  inclusiveStatement: string;
  linkedinIntro: string;
  quality: {
    score: number;
    status: 'ready' | 'needs_review';
    checks: QualityCheck[];
    missingInformation: string[];
  };
};

export type GenerationUsage = {
  mode: 'anthropic' | 'openai' | 'local-fallback';
  billingMode: 'managed' | 'byok' | 'none';
  model: string;
  responseId: string | null;
  inputTokens: number;
  cachedInputTokens: number;
  outputTokens: number;
  totalTokens: number;
  providerCostUsd: number;
  credits: number;
  customerChargeSgd: number;
};

export type JobGenerationResponse = {
  document: GeneratedJobDocument;
  usage: GenerationUsage;
  notice?: string;
};

export type GeneratedQuickDocument = { title:string; body:string };
export type QuickGenerationResponse = {
  document:GeneratedQuickDocument;
  usage:GenerationUsage;
  notice?:string;
};

export type AdvancedVisual = {
  type:'none'|'chart'|'process'|'comparison'|'source-image';
  title:string;
  description:string;
  sourceName:string;
  labels:string[];
  values:number[];
};

export type AdvancedSection = {
  title:string;
  summary:string;
  bullets:string[];
  visual:AdvancedVisual;
};

export type AdvancedDocument = {
  title:string;
  subtitle:string;
  sections:AdvancedSection[];
  sourcesUsed:string[];
  requirementCoverage:{ requirement:string; status:'addressed'|'review'; evidence:string }[];
  quality:{
    score:number;
    status:'ready'|'needs_review';
    checks:QualityCheck[];
    missingInformation:string[];
  };
};

export type AdvancedGenerationResponse = {
  document:AdvancedDocument;
  usage:GenerationUsage;
  notice?:string;
};

const bulletList = (items:string[]) => items.map(item => `• ${item}`).join('\n');

export function formatGeneratedJob(document:GeneratedJobDocument, target:'linkedin'|'portal') {
  const sections = target === 'linkedin'
    ? [
        `We’re hiring: ${document.title}`,
        document.context,
        document.organisation,
        document.companyUrl,
        '',
        document.linkedinIntro,
        '',
        'What you’ll do',
        bulletList(document.responsibilities),
        '',
        'What you’ll bring',
        bulletList(document.requiredQualifications),
        ...(document.preferredQualifications.length ? ['', 'Good to have', bulletList(document.preferredQualifications)] : []),
        ...(document.benefits.length ? ['', 'Why join us', bulletList(document.benefits)] : []),
        '',
        'How to apply',
        document.application,
        '',
        document.inclusiveStatement,
      ]
    : [
        document.title.toUpperCase(),
        document.context,
        document.organisation,
        document.companyUrl,
        '',
        'ABOUT THE ROLE',
        document.aboutRole,
        '',
        'KEY RESPONSIBILITIES',
        bulletList(document.responsibilities),
        '',
        'REQUIRED SKILLS AND EXPERIENCE',
        bulletList(document.requiredQualifications),
        ...(document.preferredQualifications.length ? ['', 'PREFERRED QUALIFICATIONS', bulletList(document.preferredQualifications)] : []),
        ...(document.benefits.length ? ['', 'WHY JOIN US', bulletList(document.benefits)] : []),
        '',
        'HOW TO APPLY',
        document.application,
        '',
        document.inclusiveStatement,
      ];

  return sections
    .filter((line, index, all) => line !== '' || (index > 0 && all[index - 1] !== ''))
    .join('\n')
    .trim();
}
