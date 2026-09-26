'use client';

import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CircleHelp,
  ClipboardCheck,
  Copy,
  DollarSign,
  Download,
  FileText,
  Globe2,
  LayoutTemplate,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Trash2,
  UploadCloud,
  Users,
  WandSparkles,
  X,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatGeneratedJob } from '@/lib/job-generation';
import {
  DEFAULT_PRESENTATION_SLIDES,
  MAX_PRESENTATION_SLIDES,
  MIN_PRESENTATION_SLIDES,
  normalisePresentationSlideCount,
  recommendedPresentationOutputTokens,
} from '@/lib/presentation-planning';
import type {
  AdvancedDocument,
  AdvancedGenerationResponse,
  AdvancedSection,
  CoursePlan,
  GeneratedJobDocument,
  GeneratedQuickDocument,
  GeneratedQuotation,
  GenerationUsage,
  JobGenerationResponse,
  QuickGenerationResponse,
} from '@/lib/job-generation';
import {
  defaultAiSettings,
  llmModels,
  loadAiSettings,
  saveAiSettings,
} from '@/lib/ai-settings';
import type { AiSettings } from '@/lib/ai-settings';
import { extractKnowledgeFile } from '@/lib/knowledge-extraction';
import {
  MAX_KNOWLEDGE_FILES,
  MAX_TOTAL_UPLOAD_BYTES,
  removeKnowledgeContent,
  retrieveKnowledgeExcerpts,
  storeKnowledgeContent,
} from '@/lib/knowledge-retrieval';
import { SiteFooter } from '@/components/site-footer';
import { BrandLogo } from '@/components/brand-logo';
import {
  loadAdvancedBriefDraft,
  saveAdvancedBriefDraft,
} from '@/lib/advanced-brief-draft';
import { repairAndValidatePptxPackage } from '@/lib/pptx-package';
import { extractDocumentTemplate, extractWordTemplateBranding } from '@/lib/template-extraction';
import type {
  DocumentTemplateProfile,
  TemplateApplicationMode,
  WordTemplateBranding,
} from '@/lib/template-extraction';
import { completedTopicPrefixLength } from '@/lib/training-progress';
import { professionalTrainingSubtitle } from '@/lib/presentation-quality';
import { assertQuotationExportReady, buildQuotationDocx } from '@/lib/quotation-docx';

type Requirement = { id: number; text: string; mandatory: boolean };
type Source = {
  id: number;
  name: string;
  meta: string;
  status: 'Ready' | 'Checking' | 'Error';
  mimeType: string;
  kind: 'text' | 'image' | 'website';
  content: string;
  dataUrl?: string;
  url?: string;
  chunkCount?: number;
  sizeBytes?: number;
};
type GroundingMode = 'approved-only' | 'approved-plus-web';
type TrainingExerciseType = 'mcq' | 'mini-project' | 'role-play';
type TrainingDurationUnit = 'minutes' | 'hours' | 'days';
type QuickDocumentType =
  | 'appreciation'
  | 'recommendation'
  | 'testimonial'
  | 'thank-you'
  | 'cover-letter'
  | 'quotation'
  | 'proposal'
  | 'project-brief'
  | 'executive-summary'
  | 'curriculum'
  | 'job-description'
  | 'memo'
  | 'announcement'
  | 'meeting-agenda'
  | 'meeting-minutes'
  | 'sop'
  | 'leave'
  | 'medical-leave';
type DocumentFont =
  | 'source-sans'
  | 'playfair'
  | 'montserrat'
  | 'georgia'
  | 'times'
  | 'aptos'
  | 'calibri'
  | 'arial'
  | 'cambria'
  | 'garamond'
  | 'verdana';
type DocumentTheme = 'minimal' | 'corporate' | 'warm' | 'editorial' | 'formal';
type AdvancedBriefDraft = {
  mode: 'quick' | 'advanced';
  step: number;
  screen: 'brief' | 'review' | 'plan';
  coursePlan?: CoursePlan | null;
  completedTopicDocuments?:AdvancedDocument[];
  advancedType: AdvancedDocumentType;
  purpose: string;
  audience: string;
  outcome: string;
  advancedTone: string;
  visuals: VisualPreference;
  trainingExerciseTypes?: TrainingExerciseType[];
  trainingExerciseType?: TrainingExerciseType;
  trainingDurationValue?: string;
  trainingDurationUnit?: TrainingDurationUnit;
  presentationSlideCount?: number;
  proposalDetails?: ProposalDetails;
  advancedExportFormat: ExportFormat;
  maxOutputTokens?: number;
  requirements: Requirement[];
  sources: Source[];
  knowledgeNotes: string;
  groundingMode: GroundingMode;
  newReq: string;
  quickFont: DocumentFont;
  quickTheme: DocumentTheme;
  documentColours: DocumentColours;
  headerStyle: DocumentHeaderStyle;
  subheaderStyle: DocumentSubheaderStyle;
  documentTemplate?: DocumentTemplateProfile | null;
  templateMode?: TemplateApplicationMode;
};
type ProposalDetails = {
  clientNeed: string;
  proposedSolution: string;
  scopeDeliverables: string;
  measurableValue: string;
  deliveryPlan: string;
  risksAssumptions: string;
  decisionNextStep: string;
  commercialTerms: string;
};
type DocumentHeaderStyle = 'executive' | 'classic' | 'minimal';
type DocumentSubheaderStyle = 'compact' | 'balanced' | 'prominent';
type DocumentColours = { body: string; heading: string; subheading: string };
type ExportFormat = 'pdf' | 'docx' | 'pptx' | 'txt' | 'xlsx';
type AdvancedDocumentType =
  | 'presentation'
  | 'report'
  | 'business-proposal'
  | 'executive-brief'
  | 'policy'
  | 'training-material'
  | 'research-summary'
  | 'custom';
type VisualPreference = 'yes' | 'no';
type JobPostDetails = {
  qualifications: string;
  preferredQualifications: string;
  benefits: string;
  application: string;
  companyUrl: string;
};

const emptyProposalDetails = (): ProposalDetails => ({
  clientNeed: '',
  proposedSolution: '',
  scopeDeliverables: '',
  measurableValue: '',
  deliveryPlan: '',
  risksAssumptions: '',
  decisionNextStep: '',
  commercialTerms: '',
});

const proposalDetailLabels: Record<keyof ProposalDetails, string> = {
  clientNeed: 'Client situation, need or opportunity',
  proposedSolution: 'Proposed solution',
  scopeDeliverables: 'Scope and deliverables',
  measurableValue: 'Measurable value and success indicators',
  deliveryPlan: 'Delivery plan and timeline',
  risksAssumptions: 'Assumptions, risks and likely objections',
  decisionNextStep: 'Decision required and next step',
  commercialTerms: 'Commercial terms',
};

const requiredProposalDetailKeys: (keyof ProposalDetails)[] = [
  'clientNeed',
  'proposedSolution',
  'scopeDeliverables',
  'measurableValue',
  'deliveryPlan',
  'risksAssumptions',
  'decisionNextStep',
];

function isProposalBrief(
  documentType: AdvancedDocumentType,
  purpose: string,
  outcome: string,
) {
  return (
    documentType === 'business-proposal' ||
    (documentType === 'presentation' &&
      /\b(?:proposal|business case|pitch|investment|approve|approval|purchase|procurement|bid|funding|sponsorship)\b/i.test(
        `${purpose} ${outcome}`,
      ))
  );
}
type QuickDocumentConfig = {
  label: string;
  noun: string;
  heading: string;
  description: string;
  primaryLabel: string;
  primaryPlaceholder: string;
  detailLabel: string;
  detailPlaceholder: string;
  detailHelp: string;
  secondaryLabel?: string;
  secondaryPlaceholder?: string;
  tones: string[];
  checklist: string[];
};

function mergeGenerationUsage(current:GenerationUsage|null,next:GenerationUsage){
  if(!current)return next;
  return {...next,inputTokens:current.inputTokens+next.inputTokens,outputTokens:current.outputTokens+next.outputTokens,cachedInputTokens:current.cachedInputTokens+next.cachedInputTokens,totalTokens:current.totalTokens+next.totalTokens,providerCostUsd:current.providerCostUsd+next.providerCostUsd,credits:current.credits+next.credits,customerChargeSgd:current.customerChargeSgd+next.customerChargeSgd};
}

const documentFonts: Record<DocumentFont, { label: string; family: string; exportFamily:string; pdfFamily:'helvetica'|'times' }> = {
  'source-sans': {
    label: 'Source Sans 3 · Clean',
    family: 'var(--font-source-sans), Arial, sans-serif',
    exportFamily:'Source Sans 3',pdfFamily:'helvetica',
  },
  playfair: {
    label: 'Playfair Display · Elegant',
    family: 'var(--font-playfair), Georgia, serif',
    exportFamily:'Playfair Display',pdfFamily:'times',
  },
  montserrat: {
    label: 'Montserrat · Modern',
    family: 'var(--font-montserrat), Arial, sans-serif',
    exportFamily:'Montserrat',pdfFamily:'helvetica',
  },
  georgia: { label: 'Georgia · Classic', family: 'Georgia, Times, serif',exportFamily:'Georgia',pdfFamily:'times' },
  times: {
    label: 'Times New Roman · Traditional',
    family: '"Times New Roman", Times, serif',
    exportFamily:'Times New Roman',pdfFamily:'times',
  },
  aptos:{label:'Aptos · Contemporary business',family:'Aptos, "Segoe UI", Arial, sans-serif',exportFamily:'Aptos',pdfFamily:'helvetica'},
  calibri:{label:'Calibri · Familiar business',family:'Calibri, "Segoe UI", Arial, sans-serif',exportFamily:'Calibri',pdfFamily:'helvetica'},
  arial:{label:'Arial · Universal',family:'Arial, Helvetica, sans-serif',exportFamily:'Arial',pdfFamily:'helvetica'},
  cambria:{label:'Cambria · Formal report',family:'Cambria, Georgia, serif',exportFamily:'Cambria',pdfFamily:'times'},
  garamond:{label:'Garamond · Refined',family:'Garamond, Georgia, serif',exportFamily:'Garamond',pdfFamily:'times'},
  verdana:{label:'Verdana · Highly readable',family:'Verdana, Arial, sans-serif',exportFamily:'Verdana',pdfFamily:'helvetica'},
};

function documentFontFromFamily(value:string):DocumentFont{
  const detected=value.toLowerCase();
  return (Object.entries(documentFonts).find(([,item])=>detected.includes(item.exportFamily.toLowerCase()))?.[0] as DocumentFont|undefined)||'source-sans';
}

function pdfFontFromFamily(value:string){return /playfair|georgia|times|cambria|garamond|serif/i.test(value)?'times' as const:'helvetica' as const;}

const documentThemes: Record<
  DocumentTheme,
  {
    label: string;
    description: string;
    surface: string;
    accent: string;
    soft: string;
    text: string;
    border: string;
  }
> = {
  minimal: {
    label: 'Minimal',
    description: 'Clean black and white',
    surface: '#ffffff',
    accent: '#161616',
    soft: '#f1f1ef',
    text: '#353535',
    border: '#dededb',
  },
  corporate: {
    label: 'Corporate blue',
    description: 'Structured and authoritative',
    surface: '#fbfcff',
    accent: '#1e3a5f',
    soft: '#eaf0f6',
    text: '#293746',
    border: '#c5d2df',
  },
  warm: {
    label: 'Warm ivory',
    description: 'Personal and approachable',
    surface: '#fffaf4',
    accent: '#8b4a2f',
    soft: '#f5e9dd',
    text: '#4d3a32',
    border: '#dec8b8',
  },
  editorial: {
    label: 'Editorial',
    description: 'Refined and publication-ready',
    surface: '#fffdf8',
    accent: '#51483e',
    soft: '#eee8dd',
    text: '#3f3a34',
    border: '#d7cec0',
  },
  formal: {
    label: 'Formal green',
    description: 'Professional and established',
    surface: '#fbfdfb',
    accent: '#1f4b38',
    soft: '#e7f0eb',
    text: '#31443b',
    border: '#bfd0c6',
  },
};

const quickDocuments: Record<QuickDocumentType, QuickDocumentConfig> = {
  appreciation: {
    label: 'Appreciation letter',
    noun: 'letter',
    heading: 'Write an appreciation letter',
    description:
      'Recognise someone’s contribution with a thoughtful, professional message.',
    primaryLabel: 'Who is it for?',
    primaryPlaceholder: 'e.g. Hamsi',
    detailLabel: 'What would you like to recognise?',
    detailPlaceholder: 'Describe what they did and the difference it made…',
    detailHelp: 'Include a specific contribution and its positive impact.',
    tones: [
      'Warm and sincere',
      'Professional and appreciative',
      'Concise and heartfelt',
      'Formal recognition',
    ],
    checklist: ['Recipient', 'Contribution and impact', 'Preferred tone'],
  },
  recommendation: {
    label: 'Recommendation letter',
    noun: 'letter',
    heading: 'Write a recommendation letter',
    description:
      'Turn evidence of someone’s strengths into a credible recommendation.',
    primaryLabel: 'Who are you recommending?',
    primaryPlaceholder: 'e.g. Hamsi',
    detailLabel: 'Which strengths and achievements should be highlighted?',
    detailPlaceholder: 'Share specific skills, examples and results…',
    detailHelp: 'Specific evidence makes the recommendation more credible.',
    secondaryLabel: 'What are they being recommended for?',
    secondaryPlaceholder: 'e.g. Senior Data Coach role',
    tones: [
      'Professional and confident',
      'Warm and supportive',
      'Formal and authoritative',
      'Concise and direct',
    ],
    checklist: [
      'Candidate',
      'Strengths and evidence',
      'Opportunity or purpose',
    ],
  },
  quotation: {
    label: 'Business quotation',
    noun: 'quotation',
    heading: 'Create a business quotation',
    description:
      'Prepare a clear commercial quote with scope, pricing and terms.',
    primaryLabel: 'Who is the quotation for?',
    primaryPlaceholder: 'Client or company name',
    detailLabel: 'Itemized scope and pricing',
    detailPlaceholder: 'One item per line: description | quantity | unit price | amount',
    detailHelp: 'Include the currency and separate every priced service or product. Add delivery assumptions and exclusions where relevant.',
    secondaryLabel: 'Currency, tax and quotation validity',
    secondaryPlaceholder: 'e.g. SGD · GST 9% · Valid for 30 days',
    tones: [
      'Professional and clear',
      'Concise and commercial',
      'Formal and detailed',
    ],
    checklist: ['Client and supplier', 'Itemized pricing', 'Tax, validity and payment details'],
  },
  curriculum: {
    label: 'Curriculum structure',
    noun: 'curriculum',
    heading: 'Design a curriculum structure',
    description:
      'Organise learning outcomes into a practical sequence of modules.',
    primaryLabel: 'Course or programme name',
    primaryPlaceholder: 'e.g. AI Fluency for Consultants',
    detailLabel: 'Who are the learners and what should they achieve?',
    detailPlaceholder:
      'Describe the audience, starting level and learning outcomes…',
    detailHelp: 'Focus on observable skills learners should demonstrate.',
    secondaryLabel: 'Duration or number of modules',
    secondaryPlaceholder: 'e.g. 6 weeks · 8 modules',
    tones: [
      'Practical and instructional',
      'Academic and structured',
      'Executive and concise',
    ],
    checklist: ['Programme', 'Learners and outcomes', 'Duration or modules'],
  },
  proposal: {
    label: 'Business proposal',
    noun: 'proposal',
    heading: 'Create a business proposal',
    description: 'Shape a business need into a focused, persuasive proposal.',
    primaryLabel: 'Who is the proposal for?',
    primaryPlaceholder: 'Client, sponsor or organisation',
    detailLabel: 'What problem will you solve and how?',
    detailPlaceholder:
      'Describe the need, proposed solution and expected value…',
    detailHelp: 'Add measurable benefits when possible.',
    secondaryLabel: 'Commercial terms or next step',
    secondaryPlaceholder: 'e.g. SGD 25,000 · approve discovery workshop',
    tones: [
      'Persuasive and professional',
      'Executive and concise',
      'Consultative and practical',
      'Formal and detailed',
    ],
    checklist: [
      'Audience',
      'Problem, solution and value',
      'Terms or next step',
    ],
  },
  leave: {
    label: 'Leave request',
    noun: 'request',
    heading: 'Write a leave request',
    description:
      'Create a respectful request with dates and a clear handover plan.',
    primaryLabel: 'Who is the request addressed to?',
    primaryPlaceholder: 'Manager or HR contact',
    detailLabel: 'When will you be away and how will work be covered?',
    detailPlaceholder: 'Add dates, return date and handover arrangements…',
    detailHelp: 'Only include personal details you are comfortable sharing.',
    secondaryLabel: 'Reason (optional)',
    secondaryPlaceholder: 'e.g. Personal leave',
    tones: [
      'Professional and courteous',
      'Warm and respectful',
      'Formal and concise',
    ],
    checklist: ['Approver', 'Leave dates', 'Coverage plan'],
  },
  'medical-leave': {
    label: 'Medical leave request',
    noun: 'request',
    heading: 'Write a medical leave request',
    description:
      'Communicate medical leave professionally without unnecessary health details.',
    primaryLabel: 'Who is the request addressed to?',
    primaryPlaceholder: 'Manager or HR contact',
    detailLabel: 'What are the leave dates and work-coverage arrangements?',
    detailPlaceholder:
      'Add dates, expected return and urgent handover details…',
    detailHelp: 'A diagnosis is not required. Share only what is necessary.',
    secondaryLabel: 'Supporting note (optional)',
    secondaryPlaceholder: 'e.g. Medical certificate available',
    tones: [
      'Professional and discreet',
      'Formal and concise',
      'Warm and respectful',
    ],
    checklist: ['Approver', 'Medical leave dates', 'Coverage or certificate'],
  },
  testimonial: {
    label: 'Testimonial',
    noun: 'testimonial',
    heading: 'Write a testimonial',
    description:
      'Turn a real experience into a specific and credible endorsement.',
    primaryLabel: 'Who or what is the testimonial about?',
    primaryPlaceholder: 'Person, company, product or service',
    detailLabel: 'What was your experience and result?',
    detailPlaceholder:
      'Describe the situation, what stood out and the outcome…',
    detailHelp: 'Concrete results make a testimonial more trustworthy.',
    secondaryLabel: 'Where will it be used?',
    secondaryPlaceholder: 'e.g. Website, LinkedIn or proposal',
    tones: [
      'Authentic and enthusiastic',
      'Professional and credible',
      'Warm and conversational',
      'Concise and punchy',
    ],
    checklist: ['Subject', 'Experience and outcome', 'Intended use'],
  },
  'thank-you': {
    label: 'Thank-you email',
    noun: 'email',
    heading: 'Write a thank-you email',
    description: 'Send a brief, genuine message of thanks.',
    primaryLabel: 'Who are you thanking?',
    primaryPlaceholder: 'Person or team',
    detailLabel: 'What are you thanking them for?',
    detailPlaceholder: 'Describe what they did and why it mattered…',
    detailHelp: 'A specific detail makes the message feel genuine.',
    secondaryLabel: 'Any next step?',
    secondaryPlaceholder: 'e.g. Looking forward to working together',
    tones: [
      'Warm and sincere',
      'Professional and concise',
      'Friendly and conversational',
    ],
    checklist: ['Recipient', 'Reason for thanks', 'Closing or next step'],
  },
  'cover-letter': {
    label: 'Cover letter',
    noun: 'letter',
    heading: 'Write a cover letter',
    description: 'Connect your experience to a specific role and employer.',
    primaryLabel: 'Which role and organisation?',
    primaryPlaceholder: 'e.g. Product Manager at Chams',
    detailLabel: 'Which experience and strengths are most relevant?',
    detailPlaceholder: 'Share achievements, skills and motivation…',
    detailHelp: 'Use evidence that directly matches the opportunity.',
    secondaryLabel: 'Hiring manager or recipient (optional)',
    secondaryPlaceholder: 'Name or hiring team',
    tones: [
      'Confident and professional',
      'Warm and enthusiastic',
      'Concise and direct',
    ],
    checklist: ['Role and company', 'Relevant evidence', 'Motivation'],
  },
  'project-brief': {
    label: 'Project brief',
    noun: 'brief',
    heading: 'Create a project brief',
    description: 'Capture a project’s purpose, scope and expected outcome.',
    primaryLabel: 'What is the project called?',
    primaryPlaceholder: 'Project or initiative name',
    detailLabel: 'What should the project achieve?',
    detailPlaceholder:
      'Describe the problem, scope, deliverables and success measures…',
    detailHelp: 'Include what is in scope and what success looks like.',
    secondaryLabel: 'Owner, deadline or key constraint',
    secondaryPlaceholder: 'e.g. Product team · launch by December',
    tones: [
      'Clear and practical',
      'Executive and concise',
      'Structured and detailed',
    ],
    checklist: ['Project', 'Scope and outcomes', 'Ownership or constraints'],
  },
  'executive-summary': {
    label: 'Executive summary',
    noun: 'summary',
    heading: 'Create an executive summary',
    description: 'Condense complex information into the points leaders need.',
    primaryLabel: 'What is being summarised?',
    primaryPlaceholder: 'Report, initiative or decision topic',
    detailLabel: 'What are the essential facts and findings?',
    detailPlaceholder: 'Paste the key context, evidence and conclusions…',
    detailHelp: 'Prioritise implications, risks and decisions over background.',
    secondaryLabel: 'Decision or action required',
    secondaryPlaceholder: 'e.g. Approve the recommended option',
    tones: [
      'Executive and concise',
      'Analytical and neutral',
      'Persuasive and decisive',
    ],
    checklist: ['Subject', 'Key findings', 'Decision or action'],
  },
  'job-description': {
    label: 'Job description',
    noun: 'description',
    heading: 'Create a job description',
    description:
      'Define a role with clear responsibilities and success expectations.',
    primaryLabel: 'What is the job title?',
    primaryPlaceholder: 'e.g. Senior Data Analyst',
    detailLabel: 'What will this person own and deliver?',
    detailPlaceholder:
      'Describe responsibilities, skills and expected outcomes…',
    detailHelp: 'Separate essential requirements from preferences.',
    secondaryLabel: 'Team, location or employment type',
    secondaryPlaceholder: 'e.g. AI team · Singapore · Full-time',
    tones: [
      'Professional and inclusive',
      'Clear and practical',
      'Engaging and candidate-friendly',
    ],
    checklist: ['Role', 'Responsibilities and skills', 'Working context'],
  },
  memo: {
    label: 'Internal memo',
    noun: 'memo',
    heading: 'Write an internal memo',
    description:
      'Communicate an internal decision, update or instruction clearly.',
    primaryLabel: 'Who is the memo for?',
    primaryPlaceholder: 'Team, department or organisation',
    detailLabel: 'What do people need to know?',
    detailPlaceholder: 'Describe the context, decision and implications…',
    detailHelp: 'Lead with the message, then explain why it matters.',
    secondaryLabel: 'Action or effective date',
    secondaryPlaceholder: 'e.g. New process starts 1 October',
    tones: [
      'Clear and professional',
      'Direct and concise',
      'Supportive and explanatory',
    ],
    checklist: ['Audience', 'Core message', 'Action or timing'],
  },
  announcement: {
    label: 'Announcement',
    noun: 'announcement',
    heading: 'Write an announcement',
    description: 'Share news with the right context and next steps.',
    primaryLabel: 'Who is the announcement for?',
    primaryPlaceholder: 'Employees, customers or community',
    detailLabel: 'What are you announcing?',
    detailPlaceholder: 'Describe the news, why it matters and key details…',
    detailHelp: 'Answer what is changing, when and who is affected.',
    secondaryLabel: 'Call to action or contact',
    secondaryPlaceholder: 'e.g. Register by Friday · Contact People Ops',
    tones: [
      'Positive and professional',
      'Clear and informative',
      'Celebratory and warm',
    ],
    checklist: ['Audience', 'News and significance', 'Next step'],
  },
  'meeting-agenda': {
    label: 'Meeting agenda',
    noun: 'agenda',
    heading: 'Create a meeting agenda',
    description: 'Turn a meeting objective into a focused, timed agenda.',
    primaryLabel: 'What is the meeting?',
    primaryPlaceholder: 'Meeting title',
    detailLabel: 'What must be discussed or decided?',
    detailPlaceholder: 'List topics, decisions and desired outcomes…',
    detailHelp: 'Prioritise decisions and preparation over status updates.',
    secondaryLabel: 'Date, duration or attendees',
    secondaryPlaceholder: 'e.g. 60 minutes · Product and Sales leads',
    tones: [
      'Focused and practical',
      'Formal and structured',
      'Collaborative and clear',
    ],
    checklist: [
      'Meeting purpose',
      'Topics and decisions',
      'Timing or attendees',
    ],
  },
  'meeting-minutes': {
    label: 'Meeting minutes',
    noun: 'minutes',
    heading: 'Create meeting minutes',
    description:
      'Convert meeting notes into decisions and accountable actions.',
    primaryLabel: 'Which meeting was held?',
    primaryPlaceholder: 'Meeting title and date',
    detailLabel: 'What was discussed and decided?',
    detailPlaceholder: 'Paste notes, decisions, owners and deadlines…',
    detailHelp: 'Include names only where ownership or attribution matters.',
    secondaryLabel: 'Attendees (optional)',
    secondaryPlaceholder: 'Names or teams',
    tones: [
      'Objective and structured',
      'Concise and action-focused',
      'Formal and detailed',
    ],
    checklist: ['Meeting', 'Decisions and discussion', 'Owners and actions'],
  },
  sop: {
    label: 'Standard operating procedure',
    noun: 'procedure',
    heading: 'Create a standard operating procedure',
    description: 'Turn a repeatable task into clear, controlled steps.',
    primaryLabel: 'What process is this for?',
    primaryPlaceholder: 'Process or procedure name',
    detailLabel: 'How is the work performed?',
    detailPlaceholder:
      'Describe triggers, steps, roles, checks and exceptions…',
    detailHelp: 'Write steps in the order a new team member would follow.',
    secondaryLabel: 'Owner, tools or policy reference',
    secondaryPlaceholder: 'e.g. Operations · CRM · Policy HR-04',
    tones: [
      'Precise and instructional',
      'Clear and practical',
      'Formal and controlled',
    ],
    checklist: ['Process', 'Steps and controls', 'Owner or references'],
  },
};

const quickRequirementSuggestions:Record<QuickDocumentType,string[]>={
  appreciation:['Name the specific contribution being recognised','Explain the positive impact on people, work or outcomes','Close with sincere, proportionate appreciation'],
  recommendation:['State the recommender relationship and context','Support strengths with specific evidence or results','Connect the candidate clearly to the opportunity'],
  testimonial:['Describe the situation or need before the engagement','Include a specific experience, differentiator or result','End with a credible recommendation without unsupported claims'],
  'thank-you':['Name the specific action or support being appreciated','Explain why it mattered','Include an appropriate closing or next step'],
  'cover-letter':['Align experience to the named role and organisation','Use specific achievements rather than generic claims','Explain motivation and finish with a clear next step'],
  'job-description':['Define outcome-led responsibilities and success expectations','Separate essential from preferred qualifications','Use inclusive language and a clear application process'],
  quotation:['Present itemized scope, quantity, price and total clearly','Keep tax, validity, payment and delivery terms explicit','Include acceptance instructions and signature fields'],
  proposal:['Define the client problem and desired outcome','Describe scope, deliverables, approach and assumptions','Show value, commercial terms and a clear approval step'],
  'project-brief':['Define objective, scope and out-of-scope boundaries','List deliverables and measurable success criteria','Identify owner, timeline, dependencies and key risks'],
  'executive-summary':['Lead with the main conclusion or decision','Distil material evidence, implications and risks','Finish with recommended action and ownership'],
  curriculum:['Use measurable learning outcomes','Sequence modules from foundation to application','Include assessment approach, duration and prerequisites'],
  sop:['State purpose, scope, owner and trigger','Provide ordered steps with roles and control checks','Cover exceptions, escalation, records and review cycle'],
  memo:['Lead with the decision, update or instruction','Explain rationale and impact on the audience','State required actions, owners and effective date'],
  announcement:['Explain what is changing, when and who is affected','Provide the reason and relevant practical details','End with a call to action or contact point'],
  'meeting-agenda':['State the meeting objective and desired decisions','Assign time, owner and outcome to each topic','List required preparation and follow-up expectations'],
  'meeting-minutes':['Record meeting date, participants and purpose','Separate decisions from discussion notes','List actions with owners and deadlines'],
  leave:['State leave and return dates clearly','Provide a practical handover or coverage plan','Keep the reason proportionate and professionally worded'],
  'medical-leave':['State leave dates and expected return where known','Provide essential work coverage information','Protect medical privacy and mention documentation only if supplied'],
};

const initialQuickRequirements=()=>Object.fromEntries((Object.keys(quickRequirementSuggestions) as QuickDocumentType[]).map(type=>[type,[...quickRequirementSuggestions[type]]])) as Record<QuickDocumentType,string[]>;

const stepMeta = [
  { name: 'Content goal', hint: 'What should be developed?', icon: Zap },
  { name: 'Knowledge', hint: 'Which content should guide it?', icon: BookOpen },
  { name: 'Requirements', hint: 'What must be covered?', icon: ClipboardCheck },
  { name: 'Output', hint: 'How should it be delivered?', icon: LayoutTemplate },
];

const advancedDocumentLabels: Record<AdvancedDocumentType, string> = {
  presentation: 'Presentation',
  report: 'Report',
  'business-proposal': 'Business proposal',
  'executive-brief': 'Executive brief',
  policy: 'Policy or procedure',
  'training-material': 'Training material',
  'research-summary': 'Research summary',
  custom: 'Custom document',
};

const trainingExerciseLabels: Record<TrainingExerciseType, string> = {
  mcq: 'MCQ',
  'mini-project': 'Mini project work',
  'role-play': 'Role play exercises',
};

function requirementSuggestions(
  documentType: AdvancedDocumentType,
  exerciseTypes: TrainingExerciseType[],
  trainingDuration: string,
) {
  const common: Record<AdvancedDocumentType, string[]> = {
    presentation: [
      'Use assertion-evidence titles that state each slide takeaway',
      'Build a coherent opening, evidence, implication and action narrative',
      'Use one clear audience-facing message per slide',
      'Use readable evidence-led layouts and concise slide copy',
    ],
    report: [
      'Include an executive summary',
      'Separate findings from recommendations',
      'State limitations and missing evidence',
    ],
    'business-proposal': [
      'Define scope, deliverables and assumptions',
      'Include measurable value and success criteria',
      'End with a clear approval or next step',
    ],
    'executive-brief': [
      'State the decision required',
      'Summarise material risks and options',
      'Provide a clear recommendation',
    ],
    policy: [
      'Define accountable roles',
      'Include ordered procedures and controls',
      'Cover exceptions, escalation and review',
    ],
    'training-material': [
      'State measurable learning objectives',
      `Provide a timed agenda that fits within ${trainingDuration}`,
      'Include facilitator guidance and learner instructions',
    ],
    'research-summary': [
      'Summarise the strongest evidence',
      'Preserve uncertainty and conflicting findings',
      'State research limitations',
    ],
    custom: [
      'Use a clear section structure',
      'Support factual claims with approved sources',
      'End with conclusions or next steps',
    ],
  };
  if (documentType !== 'training-material') return common[documentType];
  const activitySuggestions: Partial<Record<TrainingExerciseType, string>> = {
    mcq: 'Include MCQs with a separate answer key',
    'mini-project':
      'Include a mini project with deliverables and an assessment rubric',
    'role-play':
      'Include role play instructions, observer criteria and debrief questions',
  };
  return [
    ...common[documentType],
    ...exerciseTypes
      .map((type) => activitySuggestions[type])
      .filter((item): item is string => Boolean(item)),
  ];
}

const audienceOptions = [
  'Executive leadership',
  'Board or investors',
  'Clients or customers',
  'Employees or internal teams',
  'Learners or trainees',
  'Technical specialists',
  'General public',
];
const advancedToneOptions = [
  'Professional and engaging',
  'Executive and concise',
  'Persuasive and confident',
  'Clear and instructional',
  'Formal and authoritative',
  'Warm and conversational',
  'Technical and precise',
];
const formatUploadSize = (bytes: number) =>
  bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(bytes >= 100 * 1024 * 1024 ? 0 : 1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;
const DEFAULT_OUTPUT_TOKENS: Record<AdvancedDocumentType, number> = {
  presentation: 16000,
  report: 14000,
  'business-proposal': 12000,
  'executive-brief': 10000,
  policy: 12000,
  'training-material': 12000,
  'research-summary': 14000,
  custom: 12000,
};
const clampOutputTokens = (value: number) =>
  Math.max(4000, Math.min(24000, Math.round(value / 1000) * 1000));
function recommendOutputTokens({
  documentType,
  purpose,
  requirements,
  exerciseTypes: _exerciseTypes,
  durationValue: _durationValue,
  durationUnit: _durationUnit,
  visuals,
  sourceCount = 0,
  presentationSlideCount,
}: {
  documentType: AdvancedDocumentType;
  purpose: string;
  requirements: Requirement[];
  exerciseTypes: TrainingExerciseType[];
  durationValue: string;
  durationUnit: TrainingDurationUnit;
  visuals: VisualPreference;
  sourceCount?: number;
  presentationSlideCount: number;
}) {
  const requirementWeight = requirements.reduce(
    (total, item) => total + item.text.length,
    0,
  );
  let recommendation =
    DEFAULT_OUTPUT_TOKENS[documentType] +
    Math.max(0, requirements.length - 3) * 500 +
    Math.floor(requirementWeight / 600) * 500;
  if (purpose.length > 500) recommendation += 1000;
  if (
    visuals === 'yes' &&
    (documentType === 'presentation' || documentType === 'training-material')
  )
    recommendation += 1000;
  if (documentType === 'presentation') {
    recommendation = recommendedPresentationOutputTokens({
      slideCount: presentationSlideCount,
      sourceCount,
      requirementCount: requirements.length,
      requirementCharacters: requirementWeight,
      visuals: visuals === 'yes',
      longPurpose: purpose.length > 500,
    });
  }
  if (documentType === 'training-material') {
    const coreRequirements = requirements.filter(
      (item) =>
        !/\b(?:mcq|multiple choice|mini project|role play|answer key|rubric)\b/i.test(
          item.text,
        ),
    );
    recommendation =
      8000 +
      Math.min(2000, sourceCount * 250) +
      Math.max(0, coreRequirements.length - 3) * 500 +
      (visuals === 'yes' ? 1000 : 0) +
      (purpose.length > 500 ? 1000 : 0);
  }
  return clampOutputTokens(Math.ceil(recommendation / 1000) * 1000);
}

function recommendExerciseTokens(
  exerciseTypes: TrainingExerciseType[],
  requirements: Requirement[],
) {
  const matchingRequirements = requirements.filter((item) =>
    /\b(?:mcq|multiple choice|mini project|role play|answer key|rubric|exercise|assessment)\b/i.test(
      item.text,
    ),
  ).length;
  return clampOutputTokens(
    4000 + exerciseTypes.length * 2000 + matchingRequirements * 500,
  );
}

function getAdvancedDraftSections(
  documentType: AdvancedDocumentType,
  purpose: string,
  visuals: VisualPreference,
): [string, string][] {
  const objective =
    purpose ||
    `Develop a clear ${advancedDocumentLabels[documentType].toLowerCase()} from the supplied knowledge.`;
  const visualNote =
    visuals === 'yes'
      ? ' Include a purposeful chart, diagram, image or layout suggestion where it strengthens understanding.'
      : '';
  if (documentType === 'presentation')
    return [
      ['Opening slide', objective],
      [
        'Context and evidence',
        `Introduce the essential background and strongest source-supported facts.${visualNote}`,
      ],
      [
        'Core message',
        `Build a focused narrative around the principal findings, proposal or recommendation.${visualNote}`,
      ],
      [
        'Closing slide',
        'Summarise the takeaway and make the requested response or next step explicit.',
      ],
    ];
  if (documentType === 'report' || documentType === 'research-summary')
    return [
      ['Executive summary', objective],
      [
        'Evidence and findings',
        'Organise the supplied evidence into clear themes, separating facts from interpretation.',
      ],
      ['Analysis', 'Explain implications, limitations and material risks.'],
      [
        'Conclusion and next steps',
        'Summarise what the reader should understand or do next.',
      ],
    ];
  if (documentType === 'business-proposal')
    return [
      ['Proposal summary', objective],
      [
        'Need and opportunity',
        'Describe the client or business need using supplied evidence.',
      ],
      [
        'Proposed solution',
        'Set out the approach, scope, deliverables and value.',
      ],
      [
        'Commercials and next step',
        'Present assumptions, terms and the action required to proceed.',
      ],
    ];
  if (documentType === 'training-material')
    return [
      ['Learning purpose', objective],
      [
        'Learning outcomes',
        'Define what learners should understand or be able to do.',
      ],
      [
        'Content sequence',
        `Organise topics and activities into a logical learning path.${visualNote}`,
      ],
      [
        'Assessment and application',
        'Confirm how learning will be practised and evaluated.',
      ],
    ];
  return [
    ['Purpose', objective],
    [
      'Essential context',
      'Present the source-supported background the reader needs.',
    ],
    [
      'Main content',
      `Develop the required sections in a clear, logical order.${visualNote}`,
    ],
    [
      'Conclusion or action',
      'Close with the intended response, decision or next step.',
    ],
  ];
}

export default function Home() {
  const [mode, setMode] = useState<'quick' | 'advanced'>('quick');
  const [step, setStep] = useState(0);
  const [screen, setScreen] = useState<'brief' | 'review' | 'plan' | 'draft'>(
    'brief',
  );
  const [advancedType, setAdvancedType] =
    useState<AdvancedDocumentType>('presentation');
  const [purpose, setPurpose] = useState('');
  const [audience, setAudience] = useState('Executive leadership');
  const [outcome, setOutcome] = useState('');
  const [advancedTone, setAdvancedTone] = useState('Professional and engaging');
  const [visuals, setVisuals] = useState<VisualPreference>('yes');
  const [trainingExerciseTypes, setTrainingExerciseTypes] = useState<
    TrainingExerciseType[]
  >(['mcq']);
  const [trainingDurationValue, setTrainingDurationValue] = useState('2');
  const [trainingDurationUnit, setTrainingDurationUnit] =
    useState<TrainingDurationUnit>('hours');
  const [presentationSlideCount, setPresentationSlideCount] = useState(
    DEFAULT_PRESENTATION_SLIDES,
  );
  const [proposalDetails, setProposalDetails] = useState<ProposalDetails>(
    emptyProposalDetails,
  );
  const [advancedExportFormat, setAdvancedExportFormat] =
    useState<ExportFormat>('pptx');
  const [maxOutputTokens, setMaxOutputTokens] = useState(
    DEFAULT_OUTPUT_TOKENS.presentation,
  );
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [knowledgeNotes, setKnowledgeNotes] = useState('');
  const [groundingMode, setGroundingMode] =
    useState<GroundingMode>('approved-only');
  const [newReq, setNewReq] = useState('');
  const [generating, setGenerating] = useState(false);
  const [advancedResult, setAdvancedResult] = useState<AdvancedDocument | null>(
    null,
  );
  const [coursePlan, setCoursePlan] = useState<CoursePlan | null>(null);
  const [completedTopicDocuments,setCompletedTopicDocuments]=useState<AdvancedDocument[]>([]);
  const [generationProgress,setGenerationProgress]=useState('');
  const [advancedUsage, setAdvancedUsage] = useState<GenerationUsage | null>(
    null,
  );
  const [advancedNotice, setAdvancedNotice] = useState('');
  const [advancedError, setAdvancedError] = useState('');
  const [exerciseGenerating, setExerciseGenerating] = useState(false);
  const [exerciseError, setExerciseError] = useState('');
  const [exerciseUsage, setExerciseUsage] = useState<GenerationUsage | null>(
    null,
  );
  const [quickType, setQuickType] = useState<QuickDocumentType>('appreciation');
  const [recipient, setRecipient] = useState('');
  const [appreciation, setAppreciation] = useState('');
  const [quickSecondary, setQuickSecondary] = useState('');
  const [sender, setSender] = useState('');
  const [quickTone, setQuickTone] = useState(
    quickDocuments.appreciation.tones[0],
  );
  const [quickFont, setQuickFont] = useState<DocumentFont>('source-sans');
  const [quickTheme, setQuickTheme] = useState<DocumentTheme>('minimal');
  const [documentColours, setDocumentColours] = useState<DocumentColours>({
    body: documentThemes.minimal.text,
    heading: documentThemes.minimal.accent,
    subheading: documentThemes.minimal.accent,
  });
  const [headerStyle, setHeaderStyle] =
    useState<DocumentHeaderStyle>('executive');
  const [subheaderStyle, setSubheaderStyle] =
    useState<DocumentSubheaderStyle>('balanced');
  const [documentTemplate, setDocumentTemplate] =
    useState<DocumentTemplateProfile | null>(null);
  const [templateMode, setTemplateMode] =
    useState<TemplateApplicationMode>('both');
  const [quickGenerated, setQuickGenerated] = useState(false);
  const [jobPost, setJobPost] = useState<JobPostDetails>({
    qualifications: '',
    preferredQualifications: '',
    benefits: '',
    application: '',
    companyUrl: '',
  });
  const [draftHydrated, setDraftHydrated] = useState(false);
  const [aiSettings, setAiSettings] = useState<AiSettings>(defaultAiSettings);

  useEffect(() => {
    let active = true;
    setAiSettings(loadAiSettings());
    void loadAdvancedBriefDraft<AdvancedBriefDraft>()
      .then((draft) => {
        if (!active || !draft) return;
      setMode(draft.mode);
      setStep(Math.max(0, Math.min(3, draft.step)));
      setScreen(draft.screen === 'plan' && !draft.coursePlan ? 'review' : draft.screen);
        setCoursePlan(draft.coursePlan || null);
        setCompletedTopicDocuments(draft.completedTopicDocuments||[]);
        setAdvancedType(draft.advancedType);
        setPurpose(draft.purpose);
        setAudience(draft.audience);
        setOutcome(draft.outcome);
        setAdvancedTone(draft.advancedTone);
        setVisuals(draft.visuals);
        setTrainingExerciseTypes(
          draft.trainingExerciseTypes?.length
            ? draft.trainingExerciseTypes
            : draft.trainingExerciseType
              ? [draft.trainingExerciseType]
              : ['mcq'],
        );
        setTrainingDurationValue(draft.trainingDurationValue || '2');
        setTrainingDurationUnit(draft.trainingDurationUnit || 'hours');
        setPresentationSlideCount(
          normalisePresentationSlideCount(draft.presentationSlideCount),
        );
        setProposalDetails({
          ...emptyProposalDetails(),
          ...(draft.proposalDetails || {}),
        });
        setAdvancedExportFormat(draft.advancedExportFormat);
        setMaxOutputTokens(
          clampOutputTokens(
            draft.maxOutputTokens || DEFAULT_OUTPUT_TOKENS[draft.advancedType],
          ),
        );
        setRequirements(draft.requirements);
        setSources(draft.sources);
        setKnowledgeNotes(draft.knowledgeNotes);
        setGroundingMode(draft.groundingMode);
        setNewReq(draft.newReq);
        setQuickFont(draft.quickFont);
        setQuickTheme(draft.quickTheme);
        setDocumentColours(draft.documentColours);
        setHeaderStyle(draft.headerStyle);
        setSubheaderStyle(draft.subheaderStyle);
        setDocumentTemplate(draft.documentTemplate || null);
        setTemplateMode(draft.templateMode || 'both');
      })
      .catch(() => {})
      .finally(() => {
        if (active) setDraftHydrated(true);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!draftHydrated) return;
    const meaningful = Boolean(
      purpose.trim() ||
      outcome.trim() ||
      knowledgeNotes.trim() ||
      newReq.trim() ||
      requirements.length ||
      sources.length ||
      documentTemplate ||
      coursePlan ||
      step > 0 ||
      screen === 'review' ||
      screen === 'plan',
    );
    if (!meaningful) return;
    const timer = window.setTimeout(() => {
      void saveAdvancedBriefDraft<AdvancedBriefDraft>({
        mode,
        step,
        screen:
          screen === 'plan' ? 'plan' : screen === 'review' ? 'review' : 'brief',
        coursePlan,
        completedTopicDocuments,
        advancedType,
        purpose,
        audience,
        outcome,
        advancedTone,
        visuals,
        trainingExerciseTypes,
        trainingDurationValue,
        trainingDurationUnit,
        presentationSlideCount,
        proposalDetails,
        advancedExportFormat,
        maxOutputTokens,
        requirements,
        sources,
        knowledgeNotes,
        groundingMode,
        newReq,
        quickFont,
        quickTheme,
        documentColours,
        headerStyle,
        subheaderStyle,
        documentTemplate,
        templateMode,
      });
    }, 180);
    return () => window.clearTimeout(timer);
  }, [
    draftHydrated,
    mode,
    step,
    screen,
    coursePlan,
    completedTopicDocuments,
    advancedType,
    purpose,
    audience,
    outcome,
    advancedTone,
    visuals,
    trainingExerciseTypes,
    trainingDurationValue,
    trainingDurationUnit,
    presentationSlideCount,
    proposalDetails,
    advancedExportFormat,
    maxOutputTokens,
    requirements,
    sources,
    knowledgeNotes,
    groundingMode,
    newReq,
    quickFont,
    quickTheme,
    documentColours,
    headerStyle,
    subheaderStyle,
    documentTemplate,
    templateMode,
  ]);

  const quickConfig = quickDocuments[quickType];
  const recommendedOutputTokens = recommendOutputTokens({
    documentType: advancedType,
    purpose,
    requirements,
    exerciseTypes: trainingExerciseTypes,
    durationValue: trainingDurationValue,
    durationUnit: trainingDurationUnit,
    visuals,
    sourceCount:
      sources.filter((source) => source.status === 'Ready').length +
      (knowledgeNotes.trim() ? 1 : 0),
    presentationSlideCount,
  });
  const recommendedExerciseTokens = recommendExerciseTokens(
    trainingExerciseTypes,
    requirements,
  );
  const title =
    mode === 'quick'
      ? quickGenerated
        ? `Your ${quickConfig.label.toLowerCase()}`
        : quickConfig.heading
      : screen === 'draft'
        ? advancedDocumentLabels[advancedType]
        : screen === 'plan'
          ? 'Review the course structure'
          : screen === 'review'
            ? `Review your ${advancedDocumentLabels[advancedType].toLowerCase()}`
            : 'Build your document brief';
  const description =
    mode === 'quick'
      ? quickGenerated
        ? `Review, edit or export your ${quickConfig.noun}.`
        : quickConfig.description
      : screen === 'draft'
        ? advancedType === 'training-material'
          ? 'Review the core material, then approve it to create aligned exercises.'
          : 'Version 1 is ready for human review.'
        : screen === 'plan'
          ? 'Edit the topics, timing and learning outcomes before approving material development.'
          : screen === 'review'
            ? 'Confirm what DocBeans will use before generation.'
            : 'Upload trusted knowledge, define what the content should achieve, and choose how the finished document should be delivered.';

  const changeQuickType = (value: QuickDocumentType) => {
    setQuickType(value);
    setRecipient('');
    setAppreciation('');
    setQuickSecondary('');
    setJobPost({
      qualifications: '',
      preferredQualifications: '',
      benefits: '',
      application: '',
      companyUrl: '',
    });
    setQuickTone(quickDocuments[value].tones[0]);
    setQuickGenerated(false);
  };

  const changeDocumentTheme = (value: DocumentTheme) => {
    const preset = documentThemes[value];
    setQuickTheme(value);
    setDocumentColours({
      body: preset.text,
      heading: preset.accent,
      subheading: preset.accent,
    });
  };

  const changeAdvancedType = (value: AdvancedDocumentType) => {
    setAdvancedType(value);
    setCoursePlan(null);
    setAdvancedResult(null);
    setAdvancedExportFormat(value === 'presentation' ? 'pptx' : 'docx');
    setMaxOutputTokens(
      recommendOutputTokens({
        documentType: value,
        purpose,
        requirements,
        exerciseTypes: trainingExerciseTypes,
        durationValue: trainingDurationValue,
        durationUnit: trainingDurationUnit,
        visuals: value === 'presentation' ? 'yes' : visuals,
        sourceCount:
          sources.filter((source) => source.status === 'Ready').length +
          (knowledgeNotes.trim() ? 1 : 0),
        presentationSlideCount,
      }),
    );
    setVisuals(value === 'presentation' ? 'yes' : visuals);
  };

  const addRequirement = () => {
    const text = newReq.trim();
    if (
      !text ||
      requirements.some(
        (item) => item.text.toLowerCase() === text.toLowerCase(),
      )
    )
      return;
    setRequirements((items) => [
      ...items,
      { id: Date.now(), text, mandatory: true },
    ]);
    setNewReq('');
  };

  const requestAdvancedGeneration = async (
    generationStage?: 'plan' | 'content' | 'topic' | 'assemble',
    approvedCoursePlan?: CoursePlan,
    topicOptions?:{topicIndex?:number;completedTopicDocuments:AdvancedDocument[]},
  ) => {
    const settings = loadAiSettings();
    if (settings.credentialMode === 'byok' && !settings.apiKey.trim())
      throw new Error(
        'Add your provider API key in AI settings before developing this document.',
      );
    const readySources = sources.filter((source) => source.status === 'Ready');
    const query = [
      advancedType,
      purpose,
      audience,
      outcome,
      advancedTone,
      ...Object.values(proposalDetails),
      ...requirements.map((item) => item.text),
    ].join(' ');
    const retrieved = await retrieveKnowledgeExcerpts(readySources, query);
    const preparedSources = [
      ...retrieved.filter((source) => source.kind !== 'image'),
      ...retrieved.filter((source) => source.kind === 'image').slice(0, 6),
    ];
    const response = await fetch('/api/generate-advanced', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-DocBeans-Billing-Mode': settings.credentialMode,
        ...(settings.credentialMode === 'byok'
          ? { 'X-Provider-API-Key': settings.apiKey }
          : {}),
      },
      body: JSON.stringify({
        documentType: advancedType,
        purpose,
        audience,
        outcome,
        tone: advancedTone,
        visuals,
        trainingExerciseTypes:
          advancedType === 'training-material'
            ? trainingExerciseTypes
            : undefined,
        trainingDuration:
          advancedType === 'training-material'
            ? `${trainingDurationValue} ${trainingDurationUnit}`
            : undefined,
        presentationSlideCount:
          advancedType === 'presentation' ? presentationSlideCount : undefined,
        proposalDetails: isProposalBrief(advancedType, purpose, outcome)
          ? proposalDetails
          : undefined,
        deferExercises: advancedType === 'training-material',
        generationStage,
        approvedCoursePlan,
        topicIndex:topicOptions?.topicIndex,
        completedTopicDocuments:topicOptions?.completedTopicDocuments,
        groundingMode,
        maxOutputTokens,
        recommendedOutputTokens,
        requirements: requirements.map(({ text, mandatory }) => ({
          text,
          mandatory,
        })),
        knowledgeNotes,
        sources: preparedSources.map(
          ({ name, mimeType, kind, content, dataUrl, url }) => ({
            name,
            mimeType,
            kind,
            content,
            dataUrl,
            url,
          }),
        ),
        template: documentTemplate
          ? { ...documentTemplate, applicationMode: templateMode }
          : null,
        provider: settings.provider,
        model: settings.model,
      }),
    });
    const payload = (await response.json()) as AdvancedGenerationResponse & {
      error?: string;
    };
    if (!response.ok) {
      if (payload.usage)
        setAdvancedUsage((current) =>
          mergeGenerationUsage(current, payload.usage!),
        );
      if (payload.notice) setAdvancedNotice(payload.notice);
      const generationError = new Error(
        payload.error || 'DocBeans could not complete this stage.',
      ) as Error & { generationPayload?: typeof payload };
      generationError.generationPayload = payload;
      throw generationError;
    }
    return payload;
  };

  const generate = async () => {
    setGenerating(true);
    setAdvancedError('');
    setAdvancedNotice('');
    setAdvancedUsage(null);
    try {
      const payload = await requestAdvancedGeneration(
        advancedType === 'training-material' ? 'plan' : undefined,
      );
      if(payload.usage)setAdvancedUsage(payload.usage);if(payload.notice)setAdvancedNotice(payload.notice);
      if (advancedType === 'training-material') {
        if (!payload.coursePlan)
          throw new Error('DocBeans did not return a usable course structure.');
        setCoursePlan(payload.coursePlan);
        setCompletedTopicDocuments([]);
        setScreen('plan');
      } else {
        if (!payload.document)
          throw new Error('DocBeans could not develop this document.');
        setAdvancedResult(payload.document);
        setScreen('draft');
      }
    } catch (error) {
      setAdvancedError(
        error instanceof Error
          ? error.message
          : 'DocBeans could not complete this stage.',
      );
    } finally {
      setGenerating(false);
    }
  };

  const generateCourseContent = async () => {
    if (!coursePlan) return;
    let completed=completedTopicDocuments;
    setGenerating(true);
    setAdvancedError('');
    setAdvancedNotice('');
    setAdvancedUsage(null);
    setGenerationProgress('Preparing topic generation…');
    try {
      if(completedTopicPrefixLength(coursePlan,completed)!==completed.length){completed=[];setCompletedTopicDocuments([]);}
      let cumulativeUsage:GenerationUsage|null=null;let completedDocument:AdvancedDocument|null=null;
      if(completed.length===coursePlan.topics.length){
        setGenerationProgress('Validating and assembling the saved topic decks…');
        const payload=await requestAdvancedGeneration('assemble',coursePlan,{completedTopicDocuments:completed});
        if(payload.notice)setAdvancedNotice(payload.notice);
        if(!payload.document)throw new Error('DocBeans could not assemble the saved topic materials.');
        setAdvancedResult(payload.document);setScreen('draft');return;
      }
      for(let topicIndex=completed.length;topicIndex<coursePlan.topics.length;topicIndex+=1){
        setGenerationProgress(`Developing topic ${topicIndex+1} of ${coursePlan.topics.length}: ${coursePlan.topics[topicIndex].title}`);
        const payload=await requestAdvancedGeneration('topic',coursePlan,{topicIndex,completedTopicDocuments:completed});
        if(payload.usage){cumulativeUsage=mergeGenerationUsage(cumulativeUsage,payload.usage);setAdvancedUsage(cumulativeUsage);}
        if(payload.notice)setAdvancedNotice(payload.notice);
        if(!payload.topicDocument)throw new Error(`DocBeans did not return topic ${topicIndex+1}.`);
        completed=[...completed,payload.topicDocument];setCompletedTopicDocuments(completed);
        if(payload.document)completedDocument=payload.document;
      }
      if (!completedDocument)throw new Error('DocBeans could not assemble the completed topic materials.');
      setAdvancedResult(completedDocument);
      setScreen('draft');
    } catch (error) {
      const failedPayload=(error as Error & {generationPayload?:AdvancedGenerationResponse}).generationPayload;
      if(failedPayload?.topicDocument&&failedPayload.topicIndex===completed.length){
        completed=[...completed,failedPayload.topicDocument];
        setCompletedTopicDocuments(completed);
      }
      setAdvancedError(
        error instanceof Error
          ? error.message
          : 'DocBeans could not develop the approved course structure.',
      );
    } finally {
      setGenerationProgress('');
      setGenerating(false);
    }
  };

  const generateExercises = async () => {
    if (!advancedResult || advancedType !== 'training-material') return;
    setExerciseGenerating(true);
    setExerciseError('');
    setExerciseUsage(null);
    try {
      const settings = loadAiSettings();
      if (settings.credentialMode === 'byok' && !settings.apiKey.trim())
        throw new Error(
          'Add your provider API key in AI settings before creating exercises.',
        );
      const selected = trainingExerciseTypes
        .map((type) => trainingExerciseLabels[type])
        .join(', ');
      const exerciseRequirements = requirements.filter((item) =>
        /\b(?:mcq|multiple choice|mini project|role play|answer key|rubric|exercise|assessment)\b/i.test(
          item.text,
        ),
      );
      const response = await fetch('/api/generate-advanced', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-DocBeans-Billing-Mode': settings.credentialMode,
          ...(settings.credentialMode === 'byok'
            ? { 'X-Provider-API-Key': settings.apiKey }
            : {}),
        },
        body: JSON.stringify({
          documentType: 'custom',
          purpose: `Create only the following learner exercises for the approved training material: ${selected}. Match every exercise to the approved concepts, terminology and learning outcomes. For MCQs, provide questions first and a separate answer-key section. For a mini project, provide a realistic deliverable, timing, success criteria and assessment rubric. For role play, provide roles, scenario, observer criteria and debrief prompts. Do not repeat or rewrite the core training content.`,
          audience,
          outcome,
          tone: advancedTone,
          visuals: 'no',
          groundingMode: 'approved-only',
          maxOutputTokens: recommendedExerciseTokens,
          recommendedOutputTokens: recommendedExerciseTokens,
          requirements: (exerciseRequirements.length
            ? exerciseRequirements
            : trainingExerciseTypes.map((type, index) => ({
                id: index,
                text: `Include ${trainingExerciseLabels[type]}`,
                mandatory: true,
              }))
          ).map(({ text, mandatory }) => ({ text, mandatory })),
          knowledgeNotes:
            'The approved training material below is the sole source of truth for this exercise pack.',
          sources: [
            {
              name: 'Approved training material',
              mimeType: 'application/json',
              kind: 'text',
              content: JSON.stringify({
                title: advancedResult.title,
                subtitle: advancedResult.subtitle,
                sections: advancedResult.sections,
              }),
            },
          ],
          provider: settings.provider,
          model: settings.model,
        }),
      });
      const payload = (await response.json()) as AdvancedGenerationResponse & {
        error?: string;
      };
      if (payload.usage) setExerciseUsage(payload.usage);
      if (!response.ok || !payload.document)
        throw new Error(
          payload.error || 'DocBeans could not create the exercise pack.',
        );
      const exerciseDocument = payload.document;
      setAdvancedResult((current) =>
        current
          ? {
              ...current,
              sections: [...current.sections, ...exerciseDocument.sections],
              requirementCoverage: [
                ...current.requirementCoverage,
                ...exerciseDocument.requirementCoverage,
              ],
              quality: {
                ...current.quality,
                checks: [
                  ...current.quality.checks,
                  {
                    label: 'Exercise alignment',
                    status: 'pass',
                    message: `${selected} generated from the approved training content.`,
                  },
                ],
              },
            }
          : current,
      );
    } catch (error) {
      setExerciseError(
        error instanceof Error
          ? error.message
          : 'DocBeans could not create the exercise pack.',
      );
    } finally {
      setExerciseGenerating(false);
    }
  };

  const selectAiAccess = (credentialMode: 'managed' | 'byok') => {
    const current = loadAiSettings();
    if (credentialMode === 'byok' && !current.apiKey.trim()) return;
    const next = { ...current, credentialMode };
    saveAiSettings(next);
    setAiSettings(next);
    setAdvancedError('');
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 flex h-16 items-center border-b border-border bg-background/95 px-4 backdrop-blur sm:px-6 xl:px-7">
        <div className="flex w-56 items-center gap-2.5 xl:w-64">
          <BrandLogo />
          <Badge className="ml-1 bg-accent text-[10px] text-accent-foreground">
            BETA
          </Badge>
        </div>
        <label className="mx-auto hidden h-9 w-full max-w-sm items-center gap-2 rounded-xl border border-border bg-muted/55 px-3 text-sm text-muted-foreground md:flex">
          <Search className="size-4" />
          <input
            aria-label="Search documents"
            className="min-w-0 flex-1 bg-transparent outline-none"
            placeholder="Search documents"
          />
          <kbd className="rounded-md border bg-background px-1.5 py-0.5 text-[10px]">
            ⌘ K
          </kbd>
        </label>
        <div className="ml-auto flex w-56 items-center justify-end gap-1 xl:w-64">
          <a
            href="/settings?returnTo=%2Fcreate"
            aria-label="AI settings"
            className="grid size-9 place-items-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <Settings className="size-4" />
          </a>
          <Button aria-label="Help" variant="ghost" size="icon">
            <CircleHelp />
          </Button>
          <Button aria-label="Notifications" variant="ghost" size="icon">
            <Bell />
          </Button>
          <a
            href="/portal"
            aria-label="Open user portal"
            className="ml-1 grid size-8 place-items-center rounded-full bg-primary text-xs font-semibold text-white"
          >
            HM
          </a>
        </div>
      </header>

      <div className="grid min-h-[calc(100vh-64px)] grid-cols-1 lg:grid-cols-[245px_minmax(0,1fr)]">
        <AppSidebar />
        <section className="px-4 py-7 sm:px-8 xl:px-12 xl:py-9">
          <div className="mx-auto max-w-[1140px]">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <span>Documents</span>
                  <span>/</span>
                  <span>
                    {mode === 'quick'
                      ? quickConfig.label
                      : screen === 'draft'
                        ? advancedDocumentLabels[advancedType]
                        : screen === 'plan'
                          ? 'Course structure'
                          : 'Advanced brief'}
                  </span>
                </div>
                <h1 className="font-heading text-3xl font-normal tracking-[-0.025em] sm:text-[38px]">
                  {title}
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                  {description}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="h-7 gap-1.5 bg-card px-3 text-muted-foreground"
                >
                  <span
                    className={`size-1.5 rounded-full ${(mode === 'quick' ? quickGenerated : screen === 'draft' || screen === 'plan') ? 'bg-emerald-500' : 'bg-amber-400'}`}
                  />{' '}
                  {mode === 'quick' && quickGenerated
                    ? 'Generated draft'
                    : screen === 'draft'
                      ? 'Draft ready'
                      : screen === 'plan'
                        ? 'Structure ready'
                        : 'Draft'}
                </Badge>
                {mode === 'quick' && quickGenerated ? (
                  <Button
                    variant="outline"
                    className="h-9 bg-card"
                    onClick={() => window.print()}
                  >
                    <Download /> Print / Save PDF
                  </Button>
                ) : null}
              </div>
            </div>

            <div className="mt-6 flex items-center gap-2 rounded-lg border border-border bg-card p-1.5 sm:w-fit">
              <button
                onClick={() => setMode('quick')}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${mode === 'quick' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}
              >
                Quick document
              </button>
              <button
                onClick={() => setMode('advanced')}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${mode === 'advanced' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}
              >
                Advanced brief
              </button>
            </div>

            {mode === 'quick' && (
              <QuickDocumentScreen
                documentType={quickType}
                onTypeChange={changeQuickType}
                recipient={recipient}
                setRecipient={setRecipient}
                details={appreciation}
                setDetails={setAppreciation}
                secondary={quickSecondary}
                setSecondary={setQuickSecondary}
                sender={sender}
                setSender={setSender}
                tone={quickTone}
                setTone={setQuickTone}
                font={quickFont}
                setFont={setQuickFont}
                theme={quickTheme}
                setTheme={changeDocumentTheme}
                colours={documentColours}
                setColours={setDocumentColours}
                headerStyle={headerStyle}
                setHeaderStyle={setHeaderStyle}
                subheaderStyle={subheaderStyle}
                setSubheaderStyle={setSubheaderStyle}
                jobPost={jobPost}
                setJobPost={setJobPost}
                generated={quickGenerated}
                onGenerate={() => setQuickGenerated(true)}
                onEdit={() => setQuickGenerated(false)}
              />
            )}
            {mode === 'advanced' && screen === 'brief' && (
              <BriefScreen
                step={step}
                documentType={advancedType}
                setDocumentType={changeAdvancedType}
                purpose={purpose}
                setPurpose={setPurpose}
                audience={audience}
                setAudience={setAudience}
                outcome={outcome}
                setOutcome={setOutcome}
                tone={advancedTone}
                setTone={setAdvancedTone}
                visuals={visuals}
                setVisuals={setVisuals}
                trainingExerciseTypes={trainingExerciseTypes}
                setTrainingExerciseTypes={setTrainingExerciseTypes}
                trainingDurationValue={trainingDurationValue}
                setTrainingDurationValue={setTrainingDurationValue}
                trainingDurationUnit={trainingDurationUnit}
                setTrainingDurationUnit={setTrainingDurationUnit}
                presentationSlideCount={presentationSlideCount}
                setPresentationSlideCount={setPresentationSlideCount}
                proposalDetails={proposalDetails}
                setProposalDetails={setProposalDetails}
                groundingMode={groundingMode}
                setGroundingMode={setGroundingMode}
                requirements={requirements}
                setRequirements={setRequirements}
                newReq={newReq}
                setNewReq={setNewReq}
                addRequirement={addRequirement}
                sources={sources}
                setSources={setSources}
                knowledgeNotes={knowledgeNotes}
                setKnowledgeNotes={setKnowledgeNotes}
                font={quickFont}
                setFont={setQuickFont}
                theme={quickTheme}
                setTheme={changeDocumentTheme}
                colours={documentColours}
                setColours={setDocumentColours}
                headerStyle={headerStyle}
                setHeaderStyle={setHeaderStyle}
                subheaderStyle={subheaderStyle}
                setSubheaderStyle={setSubheaderStyle}
                exportFormat={advancedExportFormat}
                setExportFormat={setAdvancedExportFormat}
                maxOutputTokens={maxOutputTokens}
                setMaxOutputTokens={setMaxOutputTokens}
                recommendedOutputTokens={recommendedOutputTokens}
                recommendedExerciseTokens={recommendedExerciseTokens}
                documentTemplate={documentTemplate}
                setDocumentTemplate={setDocumentTemplate}
                templateMode={templateMode}
                setTemplateMode={setTemplateMode}
                onBack={() => setStep((s) => Math.max(0, s - 1))}
                onNext={() =>
                  step === 3
                    ? setScreen('review')
                    : setStep((s) => Math.min(3, s + 1))
                }
              />
            )}
            {mode === 'advanced' && screen === 'review' && (
              <ReviewScreen
                documentType={advancedType}
                purpose={purpose}
                audience={audience}
                outcome={outcome}
                tone={advancedTone}
                visuals={visuals}
                trainingExerciseTypes={trainingExerciseTypes}
                trainingDuration={`${trainingDurationValue} ${trainingDurationUnit}`}
                presentationSlideCount={presentationSlideCount}
                proposalDetails={proposalDetails}
                groundingMode={groundingMode}
                requirements={requirements}
                sources={sources}
                knowledgeNotes={knowledgeNotes}
                font={quickFont}
                theme={quickTheme}
                exportFormat={advancedExportFormat}
                maxOutputTokens={maxOutputTokens}
                setMaxOutputTokens={(value) => {
                  setMaxOutputTokens(value);
                  setAdvancedError('');
                  setAdvancedUsage(null);
                  setAdvancedNotice('');
                }}
                recommendedOutputTokens={recommendedOutputTokens}
                recommendedExerciseTokens={recommendedExerciseTokens}
                documentTemplate={documentTemplate}
                templateMode={templateMode}
                aiSettings={aiSettings}
                onSelectAiAccess={selectAiAccess}
                generating={generating}
                error={advancedError}
                failedUsage={advancedUsage}
                notice={advancedNotice}
                onBack={() => {
                  setScreen('brief');
                  setStep(3);
                }}
                onGenerate={generate}
              />
            )}
          {mode === 'advanced' && screen === 'plan' && coursePlan && (
            <CoursePlanScreen
              plan={coursePlan}
              setPlan={(action)=>{setCompletedTopicDocuments([]);setCoursePlan(action);}}
              maxOutputTokens={maxOutputTokens}
              aiSettings={aiSettings}
              completedTopicCount={completedTopicDocuments.length}
              generationProgress={generationProgress}
              generating={generating}
                error={advancedError}
                usage={advancedUsage}
                notice={advancedNotice}
                onBack={() => setScreen('review')}
                onApprove={generateCourseContent}
              />
            )}
            {mode === 'advanced' && screen === 'draft' && advancedResult && (
              <DraftScreen
                documentType={advancedType}
                document={advancedResult}
                audience={audience}
                tone={advancedTone}
                visuals={visuals}
                groundingMode={groundingMode}
                exportFormat={advancedExportFormat}
                font={quickFont}
                theme={quickTheme}
                colours={documentColours}
                requirements={requirements}
                sources={sources}
                documentTemplate={documentTemplate}
                templateMode={templateMode}
                usage={advancedUsage}
                notice={advancedNotice}
                trainingExerciseTypes={trainingExerciseTypes}
                recommendedExerciseTokens={recommendedExerciseTokens}
                exerciseGenerating={exerciseGenerating}
                exerciseError={exerciseError}
                exerciseUsage={exerciseUsage}
                onGenerateExercises={generateExercises}
                onEditBrief={() => {
                  setScreen('brief');
                  setStep(0);
                }}
              />
            )}
          </div>
        </section>
      </div>
      <SiteFooter />
    </main>
  );
}

function QuickDocumentScreen({
  documentType,
  onTypeChange,
  recipient,
  setRecipient,
  details,
  setDetails,
  secondary,
  setSecondary,
  sender,
  setSender,
  tone,
  setTone,
  font,
  setFont,
  theme,
  setTheme,
  colours,
  setColours,
  headerStyle,
  setHeaderStyle,
  subheaderStyle,
  setSubheaderStyle,
  jobPost,
  setJobPost,
  generated,
  onGenerate,
  onEdit,
}: {
  documentType: QuickDocumentType;
  onTypeChange: (v: QuickDocumentType) => void;
  recipient: string;
  setRecipient: (v: string) => void;
  details: string;
  setDetails: (v: string) => void;
  secondary: string;
  setSecondary: (v: string) => void;
  sender: string;
  setSender: (v: string) => void;
  tone: string;
  setTone: (v: string) => void;
  font: DocumentFont;
  setFont: (v: DocumentFont) => void;
  theme: DocumentTheme;
  setTheme: (v: DocumentTheme) => void;
  colours: DocumentColours;
  setColours: React.Dispatch<React.SetStateAction<DocumentColours>>;
  headerStyle: DocumentHeaderStyle;
  setHeaderStyle: (v: DocumentHeaderStyle) => void;
  subheaderStyle: DocumentSubheaderStyle;
  setSubheaderStyle: (v: DocumentSubheaderStyle) => void;
  jobPost: JobPostDetails;
  setJobPost: React.Dispatch<React.SetStateAction<JobPostDetails>>;
  generated: boolean;
  onGenerate: () => void;
  onEdit: () => void;
}) {
  const config = quickDocuments[documentType];
  const preset = documentThemes[theme];
  const [copied, setCopied] = useState<'linkedin' | 'portal' | null>(null);
  const [jobResult, setJobResult] = useState<GeneratedJobDocument | null>(null);
  const [quickResult, setQuickResult] = useState<GeneratedQuickDocument | null>(
    null,
  );
  const [usage, setUsage] = useState<GenerationUsage | null>(null);
  const [notice, setNotice] = useState('');
  const [generationError, setGenerationError] = useState('');
  const [exportError, setExportError] = useState('');
  const [exporting, setExporting] = useState<ExportFormat | null>(null);
  const [generatingJob, setGeneratingJob] = useState(false);
  const [editingJob, setEditingJob] = useState(false);
  const previewRef = useRef<HTMLElement | null>(null);
  const isJobPost = documentType === 'job-description';
  const [quotationDetails,setQuotationDetails]=useState({clientContact:'',supplierContact:'',paymentTerms:'',paymentDetails:'',deliveryTerms:'',exclusions:'',acceptanceInstructions:''});
  const [quotationTemplate,setQuotationTemplate]=useState<DocumentTemplateProfile|null>(null);
  const [quotationTemplateFile,setQuotationTemplateFile]=useState<File|null>(null);
  const [quotationTemplateBranding,setQuotationTemplateBranding]=useState<WordTemplateBranding|null>(null);
  const [quickRequirementsByType,setQuickRequirementsByType]=useState<Record<QuickDocumentType,string[]>>(initialQuickRequirements);
  const [newQuickRequirement,setNewQuickRequirement]=useState('');
  const quickRequirements=quickRequirementsByType[documentType];
  const recommendedQuickRequirements=quickRequirementSuggestions[documentType];
  const customQuickRequirements=quickRequirements.filter(requirement=>!recommendedQuickRequirements.includes(requirement));
  const missingQuotationDetails=documentType==='quotation'?[!quotationDetails.supplierContact.trim()&&'supplier contact',!quotationDetails.paymentTerms.trim()&&'payment terms',!quotationDetails.paymentDetails.trim()&&'payment details'].filter(Boolean) as string[]:[];
  const toggleQuickRequirement=(requirement:string)=>setQuickRequirementsByType(current=>({...current,[documentType]:current[documentType].includes(requirement)?current[documentType].filter(item=>item!==requirement):[...current[documentType],requirement]}));
  const addQuickRequirement=()=>{const requirement=newQuickRequirement.trim().slice(0,300);if(!requirement)return;setQuickRequirementsByType(current=>({...current,[documentType]:current[documentType].includes(requirement)?current[documentType]:[...current[documentType],requirement].slice(0,12)}));setNewQuickRequirement('');};
  useEffect(()=>{if(!quotationTemplateFile||quotationTemplateBranding)return;let active=true;void extractWordTemplateBranding(quotationTemplateFile).then(branding=>{if(active)setQuotationTemplateBranding(branding);}).catch(()=>{});return()=>{active=false;};},[quotationTemplateFile,quotationTemplateBranding]);

  const downloadBlob = (blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const downloadDocument = async (format: ExportFormat) => {
    if (!previewRef.current) return;
    const baseName =
      config.label
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') || 'docbeans-document';
    const text = previewRef.current.innerText.trim();
    const lines = text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    const quotation = documentType === 'quotation' ? quickResult?.quotation : undefined;
    const selectedFont=documentFonts[font];
    const pdfFont=quotationTemplate?pdfFontFromFamily(quotationTemplate.design.fontFamily):selectedFont.pdfFamily;
    setExporting(format);
    setExportError('');
    try {
      if(documentType==='quotation'){
        if(!quickResult)throw new Error('Generate a complete structured quotation before downloading.');
        assertQuotationExportReady(quickResult);
      }
      if (format === 'txt') {
        downloadBlob(
          new Blob([text], { type: 'text/plain;charset=utf-8' }),
          `${baseName}.txt`,
        );
      } else if (format === 'pdf') {
        const { jsPDF } = await import('jspdf');
        const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 54;
        if (quotation) {
          const shown=(value:string,fallback='Not provided')=>value.trim()||fallback;
          pdf.setFont(pdfFont,'bold');pdf.setFontSize(9);pdf.setTextColor(colours.subheading);pdf.text('COMMERCIAL QUOTATION',margin,54);
          pdf.setFontSize(22);pdf.setTextColor(colours.heading);pdf.text(quickResult?.title||`Quotation for ${quotation.preparedFor}`,margin,82,{maxWidth:pageWidth-margin*2});
          pdf.setDrawColor(colours.heading);pdf.setLineWidth(1.2);pdf.line(margin,96,pageWidth-margin,96);
          const meta=[['Quotation no.',quotation.quotationNumber],['Issue date',quotation.issueDate],['Validity',quotation.validity],['Currency',quotation.currency]];
          meta.forEach(([label,value],index)=>{const x=margin+index*((pageWidth-margin*2)/4);pdf.setFontSize(7.5);pdf.setTextColor(110);pdf.text(label.toUpperCase(),x,119);pdf.setFontSize(9.5);pdf.setFont(pdfFont,'bold');pdf.setTextColor(colours.body);pdf.text(shown(value),x,136,{maxWidth:(pageWidth-margin*2)/4-8});});
          pdf.setFont(pdfFont,'normal');pdf.setFontSize(9);pdf.text(`Prepared for: ${shown(quotation.preparedFor)}`,margin,164);pdf.text(`Prepared by: ${shown(quotation.preparedBy)}`,pageWidth/2,164);pdf.setFontSize(7.5);pdf.setTextColor(95);pdf.text(shown(quotation.clientContact,'Contact details not provided'),margin,179,{maxWidth:pageWidth/2-margin-12});pdf.text(shown(quotation.supplierContact,'Contact details not provided'),pageWidth/2,179,{maxWidth:pageWidth/2-margin});
          let y=212;const col=[margin,330,380,458,pageWidth-margin];pdf.setFillColor(colours.heading);pdf.rect(margin,y,col[4]-margin,24,'F');pdf.setTextColor(255);pdf.setFont(pdfFont,'bold');pdf.setFontSize(8);['Description','Qty','Unit price','Amount'].forEach((label,index)=>pdf.text(label,col[index]+6,y+16));y+=24;
          pdf.setTextColor(colours.body);pdf.setFont(pdfFont,'normal');
          for(const item of quotation.items){const description=pdf.splitTextToSize(shown(item.description),col[1]-col[0]-12) as string[];const rowH=Math.max(30,description.length*11+10);pdf.setDrawColor(220);pdf.rect(margin,y,col[4]-margin,rowH);description.forEach((line,index)=>pdf.text(line,col[0]+6,y+16+index*11));pdf.text(shown(item.quantity,'—'),col[1]+6,y+16);pdf.text(shown(item.unitPrice,'—'),col[2]+6,y+16);pdf.text(shown(item.amount,'—'),col[3]+6,y+16);y+=rowH;}
          const totals=[['Subtotal',quotation.subtotal],[quotation.taxLabel||'Tax',quotation.taxAmount],['Total',quotation.total]].filter(([,value])=>value.trim());
          totals.forEach(([label,value],index)=>{pdf.setFont(pdfFont,index===totals.length-1?'bold':'normal');pdf.text(label,col[2]+6,y+18);pdf.text(value,col[3]+6,y+18);y+=24;});
          y+=14;for(const [label,value] of [['Payment terms',quotation.paymentTerms],['Payment details',quotation.paymentDetails],['Delivery and scope',quotation.deliveryTerms],['Exclusions',quotation.exclusions],['Acceptance',quotation.acceptanceInstructions]]){pdf.setFont(pdfFont,'bold');pdf.setFontSize(9);pdf.setTextColor(colours.subheading);pdf.text(label.toUpperCase(),margin,y);y+=14;pdf.setFont(pdfFont,'normal');pdf.setTextColor(colours.body);const wrapped=pdf.splitTextToSize(value.trim()||'Not specified in the supplied brief.',pageWidth-margin*2) as string[];for(const line of wrapped){pdf.text(line,margin,y);y+=12;}y+=12;}
          pdf.save(`${baseName}.pdf`);return;
        }
        pdf.setFont(pdfFont, 'bold');
        pdf.setFontSize(20);
        pdf.setTextColor(colours.heading);
        pdf.text(config.label, margin, 68);
        pdf.setDrawColor(colours.heading);
        pdf.line(margin, 82, pageWidth - margin, 82);
        pdf.setFont(pdfFont, 'normal');
        pdf.setFontSize(11);
        pdf.setTextColor(colours.body);
        const wrapped = pdf.splitTextToSize(
          text,
          pageWidth - margin * 2,
        ) as string[];
        let y = 108;
        for (const line of wrapped) {
          if (y > pageHeight - margin) {
            pdf.addPage();
            y = margin;
          }
          pdf.text(line, margin, y);
          y += 16;
        }
        pdf.save(`${baseName}.pdf`);
      } else if (format === 'docx') {
        if(documentType==='quotation'){
          if(!quickResult)throw new Error('Generate the quotation again before downloading it.');
          const outputBlob=await buildQuotationDocx(quickResult,{
            fontFamily:quotationTemplate?.design.fontFamily||selectedFont.exportFamily,
            headingColor:quotationTemplate?.design.headingColor||colours.heading,
            bodyColor:quotationTemplate?.design.bodyColor||colours.body,
            templateFile:quotationTemplateFile,
          });
          downloadBlob(outputBlob,`${baseName}.docx`);return;
        }
        const { Document, HeadingLevel, Packer, Paragraph, TextRun } =
          await import('docx');
        const children = [
          new Paragraph({ text: config.label, heading: HeadingLevel.TITLE }),
          ...lines.map(
            (line, index) =>
              new Paragraph({
                children: [new TextRun({ text: line, bold: index === 0 })],
                spacing: { after: 160 },
              }),
          ),
        ];
        const file = new Document({ styles:{default:{document:{run:{font:selectedFont.exportFamily}}}},sections: [{ properties: {}, children }] });
        downloadBlob(await Packer.toBlob(file), `${baseName}.docx`);
      } else if (format === 'pptx') {
        const PptxGenJS = (await import('pptxgenjs')).default;
        const deck = new PptxGenJS();
        deck.layout = 'LAYOUT_WIDE';
        deck.author = 'DocBeans';
        deck.subject = config.label;
        deck.title = config.label;
        deck.company = 'DocBeans';
        const quickExportFont=selectedFont.exportFamily;
        const titleSlide = deck.addSlide();
        titleSlide.background = { color: preset.surface.replace('#', '') };
        titleSlide.addShape(deck.ShapeType.rect, {
          x: 0,
          y: 0,
          w: 0.18,
          h: 7.5,
          fill: { color: colours.heading.replace('#', '') },
          line: { color: colours.heading.replace('#', '') },
        });
        titleSlide.addText(config.label, {
          x: 0.8,
          y: 2.25,
          w: 10.8,
          h: 1,
          fontFace: quickExportFont,
          fontSize: 28,
          bold: true,
          color: colours.heading.replace('#', ''),
          margin: 0,
        });
        titleSlide.addText('Generated with DocBeans', {
          x: 0.82,
          y: 3.35,
          w: 5,
          h: 0.35,
          fontFace: quickExportFont,
          fontSize: 11,
          color: colours.subheading.replace('#', ''),
          margin: 0,
        });
        const contentLines = lines.slice(1);
        for (let i = 0; i < contentLines.length; i += 8) {
          const slide = deck.addSlide();
          slide.background = { color: preset.surface.replace('#', '') };
          slide.addText(config.label, {
            x: 0.65,
            y: 0.42,
            w: 11.8,
            h: 0.4,
            fontFace: quickExportFont,
            fontSize: 18,
            bold: true,
            color: colours.heading.replace('#', ''),
            margin: 0,
          });
          slide.addShape(deck.ShapeType.line, {
            x: 0.65,
            y: 0.95,
            w: 12,
            h: 0,
            line: { color: preset.border.replace('#', ''), width: 1 },
          });
          slide.addText(
            contentLines
              .slice(i, i + 8)
              .map((value) => ({
                text: value,
                options: { bullet: { indent: 18 }, breakLine: true },
              })),
            {
              x: 0.8,
              y: 1.25,
              w: 11.7,
              h: 5.65,
              fontFace: quickExportFont,
              fontSize: 17,
              color: colours.body.replace('#', ''),
              breakLine: true,
              margin: 0.08,
              paraSpaceAfter: 12,
              valign: 'top',
            },
          );
        }
        await deck.writeFile({ fileName: `${baseName}.pptx` });
      } else {
        const XLSX = await import('xlsx');
        const workbook = XLSX.utils.book_new();
        if(quotation){
          const rows=[['COMMERCIAL QUOTATION'],['Title',quickResult?.title||''],['Quotation number',quotation.quotationNumber],['Issue date',quotation.issueDate],['Prepared for',quotation.preparedFor],['Client contact',quotation.clientContact],['Prepared by',quotation.preparedBy],['Supplier contact',quotation.supplierContact],['Validity',quotation.validity],['Currency',quotation.currency],[],['Description','Quantity','Unit price','Amount'],...quotation.items.map(item=>[item.description,item.quantity,item.unitPrice,item.amount]),[],['Subtotal','','',quotation.subtotal],[quotation.taxLabel||'Tax','','',quotation.taxAmount],['Total','','',quotation.total],[],['Payment terms',quotation.paymentTerms],['Payment details',quotation.paymentDetails],['Delivery and scope',quotation.deliveryTerms],['Exclusions',quotation.exclusions],['Acceptance',quotation.acceptanceInstructions]];
          const worksheet=XLSX.utils.aoa_to_sheet(rows);worksheet['!cols']=[{wch:52},{wch:18},{wch:18},{wch:20}];XLSX.utils.book_append_sheet(workbook,worksheet,'Quotation');XLSX.writeFile(workbook,`${baseName}.xlsx`,{compression:true});return;
        }
        const rows = [
          [config.label],
          [`Generated with DocBeans`],
          [],
          ['Order', 'Document content'],
          ...lines.map((line, index) => [index + 1, line]),
        ];
        const worksheet = XLSX.utils.aoa_to_sheet(rows);
        worksheet['!cols'] = [{ wch: 10 }, { wch: 100 }];
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Document');
        XLSX.writeFile(workbook, `${baseName}.xlsx`, { compression: true });
      }
    } catch (error) {
      setExportError(
        error instanceof Error
          ? `Could not create the ${format.toUpperCase()} file: ${error.message}`
          : `Could not create the ${format.toUpperCase()} file.`,
      );
    } finally {
      setExporting(null);
    }
  };

  const copyJobPost = async (target: 'linkedin' | 'portal') => {
    if (!jobResult) return;
    await navigator.clipboard.writeText(formatGeneratedJob(jobResult, target));
    setCopied(target);
    window.setTimeout(() => setCopied(null), 1800);
  };

  const handleGenerate = async () => {
    setGeneratingJob(true);
    setGenerationError('');
    try {
      const aiSettings = loadAiSettings();
      const response = await fetch(
        isJobPost ? '/api/generate' : '/api/generate-document',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-DocBeans-Billing-Mode': aiSettings.credentialMode,
            ...(aiSettings.credentialMode === 'byok' && aiSettings.apiKey
              ? { 'X-Provider-API-Key': aiSettings.apiKey }
              : {}),
          },
          body: JSON.stringify(
            isJobPost
              ? {
                  provider: aiSettings.provider,
                  model: aiSettings.model,
                  title: recipient,
                  context: secondary,
                  organisation: sender,
                  companyUrl: jobPost.companyUrl,
                  responsibilities: details,
                  qualifications: jobPost.qualifications,
                  preferredQualifications: jobPost.preferredQualifications,
                  benefits: jobPost.benefits,
                  application: jobPost.application,
                  tone,
                  requirements: quickRequirements,
                }
              : {
                  provider: aiSettings.provider,
                  model: aiSettings.model,
                  documentType,
                  primary: recipient,
                  details,
                  secondary,
                  sender,
                  tone,
                  requirements: quickRequirements,
                  ...(documentType === 'quotation' ? quotationDetails : {}),
                },
          ),
        },
      );
      const result = (await response.json()) as (
        | JobGenerationResponse
        | QuickGenerationResponse
      ) & { error?: string };
      if (!response.ok)
        throw new Error(
          result.error || 'DocBeans could not generate this job description.',
        );
      if (isJobPost) setJobResult((result as JobGenerationResponse).document);
      else {
        const generatedDocument=(result as QuickGenerationResponse).document;
        if(documentType==='quotation')assertQuotationExportReady(generatedDocument);
        setQuickResult(generatedDocument);
      }
      setUsage(result.usage);
      try {
        const key = 'docbeans-usage-totals';
        const previous = JSON.parse(window.localStorage.getItem(key) || '{}');
        window.localStorage.setItem(
          key,
          JSON.stringify({
            generations: (previous.generations || 0) + 1,
            inputTokens: (previous.inputTokens || 0) + result.usage.inputTokens,
            outputTokens:
              (previous.outputTokens || 0) + result.usage.outputTokens,
            credits: (previous.credits || 0) + result.usage.credits,
            providerCostUsd:
              (previous.providerCostUsd || 0) + result.usage.providerCostUsd,
            customerChargeSgd:
              (previous.customerChargeSgd || 0) +
              result.usage.customerChargeSgd,
          }),
        );
      } catch {
        /* Usage display remains available for the current generation. */
      }
      setNotice(result.notice || '');
      setEditingJob(false);
      onGenerate();
    } catch (error) {
      setGenerationError(
        error instanceof Error
          ? error.message
          : 'DocBeans could not generate this job description.',
      );
    } finally {
      setGeneratingJob(false);
    }
  };

  if (generated)
    return (
      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <article
          ref={previewRef}
          className="rounded-[20px] border border-t-4 px-7 py-9 shadow-[0_16px_50px_rgba(0,0,0,0.06)] transition-colors sm:px-12 sm:py-12"
          style={{
            backgroundColor: documentType==='quotation'&&quotationTemplate?quotationTemplate.design.backgroundColor:preset.surface,
            borderColor: preset.border,
            borderTopColor: colours.heading,
          }}
        >
          {isJobPost && jobResult ? (
            <GeneratedJobPreview
              document={jobResult}
              setDocument={setJobResult}
              editing={editingJob}
              font={font}
              theme={theme}
              colours={colours}
              headerStyle={headerStyle}
              subheaderStyle={subheaderStyle}
            />
          ) : quickResult ? (
            <GeneratedQuickPreview
              document={quickResult}
              documentType={documentType}
              font={font}
              theme={theme}
              colours={colours}
              headerStyle={headerStyle}
              subheaderStyle={subheaderStyle}
              quotationTemplateBranding={quotationTemplateBranding}
            />
          ) : (
            <QuickDraft
              type={documentType}
              primary={recipient.trim()}
              details={details.trim()}
              secondary={secondary.trim()}
              sender={sender.trim()}
              font={font}
              theme={theme}
              colours={colours}
              headerStyle={headerStyle}
              subheaderStyle={subheaderStyle}
              jobPost={jobPost}
            />
          )}
        </article>
        <aside className="space-y-4">
          <div className="rounded-[18px] border border-border bg-card p-5">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <CheckCircle2 className="size-4" />{' '}
              {jobResult?.quality.status === 'needs_review'
                ? 'Needs your review'
                : 'Draft ready'}
            </div>
            <dl className="mt-4 space-y-3 text-xs">
              <div>
                <dt className="text-muted-foreground">Document</dt>
                <dd className="mt-1 font-medium">{config.label}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Style</dt>
                <dd className="mt-1 font-medium">
                  {quotationTemplate&&documentType==='quotation'?`${quotationTemplate.design.fontFamily} · company template`:`${documentFonts[font].label.split(' · ')[0]} · ${preset.label}`}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Tone</dt>
                <dd className="mt-1 font-medium">{tone}</dd>
              </div>
              {jobResult && (
                <div>
                  <dt className="text-muted-foreground">Quality score</dt>
                  <dd className="mt-1 font-medium">
                    {jobResult.quality.score}/100
                  </dd>
                </div>
              )}
            </dl>
            <div className="mt-5 grid gap-2">
              <Button variant="outline" className="w-full" onClick={onEdit}>
                Edit brief
              </Button>
              {jobResult && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setEditingJob((value) => !value)}
                >
                  {editingJob ? 'Finish editing' : 'Edit generated content'}
                </Button>
              )}
            </div>
          </div>
          <div className="rounded-[18px] border border-border bg-card p-5">
            <p className="text-sm font-semibold">Download document</p>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              Create a genuine file in the format needed for editing, presenting
              or analysis.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {(
                (documentType === 'quotation'
                  ? [['pdf', 'PDF'], ['docx', 'DOCX'], ['txt', 'TXT'], ['xlsx', 'XLSX']]
                  : [['pdf', 'PDF'], ['docx', 'DOCX'], ['pptx', 'PPTX'], ['txt', 'TXT'], ['xlsx', 'XLSX']]) as readonly (readonly [ExportFormat,string])[]
              ).map(([format, label]) => (
                <Button
                  key={format}
                  variant={format === 'pdf' ? 'default' : 'outline'}
                  className={`justify-start ${format === 'xlsx' ? 'col-span-2' : ''}`}
                  disabled={exporting !== null}
                  onClick={() => downloadDocument(format)}
                >
                  <Download /> {exporting === format ? 'Creating…' : label}
                </Button>
              ))}
            </div>
            <button
              type="button"
              className="mt-3 w-full text-center text-xs font-medium text-muted-foreground underline underline-offset-4 hover:text-foreground"
              onClick={() => window.print()}
            >
              Print instead
            </button>
            {exportError && (
              <p
                role="alert"
                className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs leading-5 text-red-800"
              >
                {exportError}
              </p>
            )}
          </div>
          {jobResult && (
            <div className="rounded-[18px] border border-border bg-card p-5">
              <p className="text-sm font-semibold">Quality checks</p>
              <div className="mt-3 space-y-3">
                {jobResult.quality.checks.map((check) => (
                  <div key={check.label} className="flex gap-2.5 text-xs">
                    <span
                      className={`mt-0.5 size-2 shrink-0 rounded-full ${check.status === 'pass' ? 'bg-emerald-500' : 'bg-amber-400'}`}
                    />
                    <div>
                      <p className="font-medium">{check.label}</p>
                      <p className="mt-0.5 leading-4 text-muted-foreground">
                        {check.message}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              {jobResult.quality.missingInformation.length > 0 && (
                <div className="mt-4 rounded-lg bg-amber-50 p-3">
                  <p className="text-xs font-semibold text-amber-900">
                    Complete before publishing
                  </p>
                  <ul className="mt-2 list-disc space-y-1 pl-4 text-[11px] text-amber-900/80">
                    {jobResult.quality.missingInformation.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          {isJobPost && jobResult && (
            <div className="rounded-[18px] border border-border bg-card p-5">
              <p className="text-sm font-semibold">
                {jobResult.quality.status === 'ready'
                  ? 'Ready to publish'
                  : 'Copy after review'}
              </p>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                Copy clean, plain text formatted for the destination.
              </p>
              {jobResult.quality.status === 'needs_review' && (
                <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-[11px] leading-4 text-amber-900">
                  This draft has review items. Copying does not mark it
                  approved.
                </p>
              )}
              <div className="mt-4 space-y-2">
                <Button
                  className="w-full justify-start"
                  onClick={() => copyJobPost('linkedin')}
                >
                  <Copy />{' '}
                  {copied === 'linkedin'
                    ? 'Copied for LinkedIn'
                    : 'Copy for LinkedIn'}
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => copyJobPost('portal')}
                >
                  <Copy />{' '}
                  {copied === 'portal'
                    ? 'Copied for job portal'
                    : 'Copy for job portal'}
                </Button>
              </div>
            </div>
          )}
        </aside>
        {usage && <UsageCard usage={usage} notice={notice} />}
      </div>
    );

  const preparedByLabel = isJobPost
    ? 'Organisation'
    : [
          'quotation',
          'proposal',
          'project-brief',
          'executive-summary',
          'curriculum',
          'meeting-agenda',
          'meeting-minutes',
          'sop',
        ].includes(documentType)
      ? 'Prepared by'
      : 'From';
  const followUps = isJobPost
    ? ([
        !secondary.trim() &&
          'Add location, workplace model and employment type.',
        !sender.trim() && 'Add the organisation name.',
        !jobPost.application.trim() &&
          'Add an application method or closing date.',
      ].filter(Boolean) as string[])
    : [];

  return (
    <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
      <section className="rounded-[20px] border border-border bg-card shadow-[0_16px_50px_rgba(0,0,0,0.06)]">
        <div className="border-b border-border px-6 py-5 sm:px-8">
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-md bg-primary text-primary-foreground">
              <Sparkles className="size-4" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[.12em] text-muted-foreground">
                Quick document
              </p>
              <h2 className="text-lg font-normal">Just the relevant details</h2>
            </div>
          </div>
        </div>
        <div className="space-y-6 p-6 sm:p-8">
          <div>
            <label htmlFor="document-type" className="field-label">
              What do you want to create?
            </label>
            <div className="relative mt-2">
              <select
                id="document-type"
                className="field-control appearance-none pr-10"
                value={documentType}
                onChange={(e) => {setNewQuickRequirement('');onTypeChange(e.target.value as QuickDocumentType);}}
              >
                <optgroup label="People and career">
                  <option value="appreciation">Appreciation letter</option>
                  <option value="thank-you">Thank-you email</option>
                  <option value="recommendation">Recommendation letter</option>
                  <option value="testimonial">Testimonial</option>
                  <option value="cover-letter">Cover letter</option>
                  <option value="job-description">Job description</option>
                </optgroup>
                <optgroup label="Business and planning">
                  <option value="quotation">Business quotation</option>
                  <option value="proposal">Business proposal</option>
                  <option value="project-brief">Project brief</option>
                  <option value="executive-summary">Executive summary</option>
                  <option value="curriculum">Curriculum structure</option>
                  <option value="sop">Standard operating procedure</option>
                </optgroup>
                <optgroup label="Communication and meetings">
                  <option value="memo">Internal memo</option>
                  <option value="announcement">Announcement</option>
                  <option value="meeting-agenda">Meeting agenda</option>
                  <option value="meeting-minutes">Meeting minutes</option>
                </optgroup>
                <optgroup label="Leave requests">
                  <option value="leave">Leave request</option>
                  <option value="medical-leave">Medical leave request</option>
                </optgroup>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-3 size-4 text-muted-foreground" />
            </div>
          </div>
          <div>
            <label htmlFor="quick-primary" className="field-label">
              {config.primaryLabel} <span>*</span>
            </label>
            <input
              id="quick-primary"
              className="field-control mt-2"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder={config.primaryPlaceholder}
            />
          </div>
          <div>
            <label htmlFor="quick-details" className="field-label">
              {config.detailLabel} <span>*</span>
            </label>
            <textarea
              id="quick-details"
              className="field-control mt-2 min-h-32 resize-none py-3"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder={config.detailPlaceholder}
            />
            <p className="field-help">{config.detailHelp}</p>
          </div>
          {config.secondaryLabel && (
            <div>
              <label htmlFor="quick-secondary" className="field-label">
                {config.secondaryLabel}
                {(isJobPost || documentType === 'quotation') && <span> *</span>}
              </label>
              <input
                id="quick-secondary"
                className="field-control mt-2"
                value={secondary}
                onChange={(e) => setSecondary(e.target.value)}
                placeholder={config.secondaryPlaceholder}
              />
            </div>
          )}
          <section className="rounded-xl border border-border bg-[#fafafa] p-4 sm:p-5" aria-labelledby="quick-requirements-heading">
            <div className="flex flex-wrap items-start justify-between gap-3"><div><p id="quick-requirements-heading" className="text-sm font-semibold">Document requirements <span>*</span></p><p className="mt-1 text-xs leading-5 text-muted-foreground">Recommended for {config.label.toLowerCase()}. Select all that apply and add your own requirement.</p></div><span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-primary">{quickRequirements.length} selected</span></div>
            <div className="mt-4 grid gap-2 md:grid-cols-3">{recommendedQuickRequirements.map(requirement=>{const active=quickRequirements.includes(requirement);return <button key={requirement} type="button" aria-pressed={active} onClick={()=>toggleQuickRequirement(requirement)} className={`rounded-xl border p-3 text-left text-xs leading-5 transition ${active?'border-primary bg-white ring-1 ring-primary/15':'border-border bg-white text-muted-foreground hover:border-primary/40'}`}><span className="flex items-start gap-2"><span className={`mt-0.5 grid size-4 shrink-0 place-items-center rounded-full border ${active?'border-primary bg-primary text-white':'border-input'}`}>{active&&<Check className="size-2.5"/>}</span><span>{requirement}</span></span></button>})}</div>
            {customQuickRequirements.length>0&&<div className="mt-3 flex flex-wrap gap-2">{customQuickRequirements.map(requirement=><span key={requirement} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-3 py-1.5 text-xs"><span>{requirement}</span><button type="button" aria-label={`Remove requirement: ${requirement}`} onClick={()=>toggleQuickRequirement(requirement)} className="text-muted-foreground hover:text-foreground"><X className="size-3"/></button></span>)}</div>}
            <div className="mt-4 flex gap-2"><input id="quick-custom-requirement" className="field-control" value={newQuickRequirement} onChange={event=>setNewQuickRequirement(event.target.value)} onKeyDown={event=>{if(event.key==='Enter'){event.preventDefault();addQuickRequirement();}}} placeholder="Add a custom requirement…" maxLength={300}/><Button type="button" variant="outline" className="shrink-0" onClick={addQuickRequirement} disabled={!newQuickRequirement.trim()||quickRequirements.length>=12}><Plus/> Add</Button></div>
            {quickRequirements.length===0&&<p role="alert" className="mt-2 text-xs text-red-700">Select or add at least one requirement.</p>}
          </section>
          {documentType === 'quotation' && (
            <div className="rounded-xl border border-border bg-[#fafafa] p-4 sm:p-5">
              <p className="text-sm font-semibold">Quotation parties, payment and delivery</p>
              <p className="mt-1 text-xs text-muted-foreground">These details appear in the commercial header and terms. DocBeans will not invent missing contact, payment or legal information.</p>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div><label htmlFor="quote-client-contact" className="field-label">Client contact and address <span className="font-normal text-muted-foreground">(optional)</span></label><textarea id="quote-client-contact" className="field-control mt-2 min-h-24 resize-none py-3" value={quotationDetails.clientContact} onChange={event=>setQuotationDetails(value=>({...value,clientContact:event.target.value}))} placeholder="Contact person, email and billing address"/></div>
                <div><label htmlFor="quote-supplier-contact" className="field-label">Supplier contact details <span className="font-normal text-muted-foreground">(optional when shown on the template)</span></label><textarea id="quote-supplier-contact" className="field-control mt-2 min-h-24 resize-none py-3" value={quotationDetails.supplierContact} onChange={event=>setQuotationDetails(value=>({...value,supplierContact:event.target.value}))} placeholder="Business address, email, phone and registration details"/></div>
                <div><label htmlFor="quote-payment-terms" className="field-label">Payment terms <span className="font-normal text-muted-foreground">(optional)</span></label><textarea id="quote-payment-terms" className="field-control mt-2 min-h-20 resize-none py-3" value={quotationDetails.paymentTerms} onChange={event=>setQuotationDetails(value=>({...value,paymentTerms:event.target.value}))} placeholder="e.g. 50% deposit on acceptance; balance due 7 days before delivery"/></div>
                <div><label htmlFor="quote-payment-details" className="field-label">Payment method and remittance details <span className="font-normal text-muted-foreground">(optional)</span></label><textarea id="quote-payment-details" className="field-control mt-2 min-h-20 resize-none py-3" value={quotationDetails.paymentDetails} onChange={event=>setQuotationDetails(value=>({...value,paymentDetails:event.target.value}))} placeholder="Bank transfer, payee/account details, payment reference or invoice instructions. Do not enter passwords, PINs or security codes."/></div>
                <div><label htmlFor="quote-delivery" className="field-label">Delivery and inclusions</label><textarea id="quote-delivery" className="field-control mt-2 min-h-20 resize-none py-3" value={quotationDetails.deliveryTerms} onChange={event=>setQuotationDetails(value=>({...value,deliveryTerms:event.target.value}))} placeholder="Mode, location, participant limit, materials and deliverables"/></div>
                <div><label htmlFor="quote-exclusions" className="field-label">Exclusions and assumptions</label><textarea id="quote-exclusions" className="field-control mt-2 min-h-20 resize-none py-3" value={quotationDetails.exclusions} onChange={event=>setQuotationDetails(value=>({...value,exclusions:event.target.value}))} placeholder="Travel, venue, customization or other exclusions"/></div>
              </div>
              <div className="mt-4"><label htmlFor="quote-acceptance" className="field-label">Acceptance instructions</label><textarea id="quote-acceptance" className="field-control mt-2 min-h-20 resize-none py-3" value={quotationDetails.acceptanceInstructions} onChange={event=>setQuotationDetails(value=>({...value,acceptanceInstructions:event.target.value}))} placeholder="How the client confirms acceptance and where to return the signed quotation"/></div>
            </div>
          )}
          {documentType === 'quotation' && (
            <QuotationTemplateUploader
              template={quotationTemplate}
              onTemplate={(template,file,branding) => {
                setQuotationTemplate(template);
                setQuotationTemplateFile(file);
                setQuotationTemplateBranding(branding);
                if (!template) return;
                setColours({
                  heading: template.design.headingColor,
                  subheading: template.design.accentColors[0] || template.design.headingColor,
                  body: template.design.bodyColor,
                });
                setFont(documentFontFromFamily(template.design.fontFamily));
              }}
            />
          )}
          {isJobPost && (
            <div className="rounded-xl border border-border bg-[#fafafa] p-4 sm:p-5">
              <div>
                <p className="text-sm font-semibold">
                  Publish-ready job details
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  DocBeans rewrites these facts; it will not invent missing
                  claims.
                </p>
              </div>
              <div className="mt-4 space-y-4">
                <div>
                  <label htmlFor="job-qualifications" className="field-label">
                    Required skills and experience <span>*</span>
                  </label>
                  <textarea
                    id="job-qualifications"
                    className="field-control mt-2 min-h-24 resize-none py-3"
                    value={jobPost.qualifications}
                    onChange={(e) =>
                      setJobPost((value) => ({
                        ...value,
                        qualifications: e.target.value,
                      }))
                    }
                    placeholder="e.g. 5+ years in consulting; practical AI delivery; strong stakeholder communication"
                  />
                  <p className="field-help">
                    Separate requirements with a new line or semicolon.
                  </p>
                </div>
                <div>
                  <label htmlFor="job-preferred" className="field-label">
                    Preferred qualifications{' '}
                    <span className="font-normal text-muted-foreground">
                      (optional)
                    </span>
                  </label>
                  <textarea
                    id="job-preferred"
                    className="field-control mt-2 min-h-20 resize-none py-3"
                    value={jobPost.preferredQualifications}
                    onChange={(e) =>
                      setJobPost((value) => ({
                        ...value,
                        preferredQualifications: e.target.value,
                      }))
                    }
                    placeholder="e.g. Cloud certification; experience in learning design"
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label htmlFor="job-benefits" className="field-label">
                      Why join / benefits{' '}
                      <span className="font-normal text-muted-foreground">
                        (optional)
                      </span>
                    </label>
                    <textarea
                      id="job-benefits"
                      className="field-control mt-2 min-h-20 resize-none py-3"
                      value={jobPost.benefits}
                      onChange={(e) =>
                        setJobPost((value) => ({
                          ...value,
                          benefits: e.target.value,
                        }))
                      }
                      placeholder="e.g. Shape regional AI adoption; learning budget; flexible work"
                    />
                  </div>
                  <div>
                    <label htmlFor="job-application" className="field-label">
                      How to apply{' '}
                      <span className="font-normal text-muted-foreground">
                        (required to publish)
                      </span>
                    </label>
                    <textarea
                      id="job-application"
                      className="field-control mt-2 min-h-20 resize-none py-3"
                      value={jobPost.application}
                      onChange={(e) =>
                        setJobPost((value) => ({
                          ...value,
                          application: e.target.value,
                        }))
                      }
                      placeholder="e.g. Apply with your CV at careers@example.com by 30 September"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label htmlFor="quick-tone" className="field-label">
                Tone
              </label>
              <div className="relative mt-2">
                <select
                  id="quick-tone"
                  className="field-control appearance-none pr-10"
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                >
                  {config.tones.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-3 size-4 text-muted-foreground" />
              </div>
            </div>
            <div>
              <label htmlFor="sender" className="field-label">
                {preparedByLabel}{' '}
                <span className="font-normal text-muted-foreground">
                  ({isJobPost ? 'required to publish' : documentType === 'quotation' ? 'required' : 'optional'})
                </span>
              </label>
              <input
                id="sender"
                className="field-control mt-2"
                value={sender}
                onChange={(e) => setSender(e.target.value)}
                placeholder={
                  isJobPost ? 'Organisation name' : 'Your name or organisation'
                }
              />
            </div>
          </div>
          {isJobPost && (
            <div>
              <label htmlFor="company-url" className="field-label">
                Company website{' '}
                <span className="font-normal text-muted-foreground">
                  (optional)
                </span>
              </label>
              <input
                id="company-url"
                type="url"
                className="field-control mt-2"
                value={jobPost.companyUrl}
                onChange={(e) =>
                  setJobPost((value) => ({
                    ...value,
                    companyUrl: e.target.value,
                  }))
                }
                placeholder="https://example.com"
              />
              <p className="field-help">
                Shown in the preview and included in LinkedIn and job-portal
                copy.
              </p>
            </div>
          )}
          <div className="rounded-xl border border-border bg-[#fafafa] p-4 sm:p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold">Document design</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Control the generated file without changing the DocBeans
                  interface.
                </p>
              </div>
              <div className="flex gap-1.5" aria-hidden="true">
                <span
                  className="size-3 rounded-full border"
                  style={{ backgroundColor: colours.heading }}
                />
                <span
                  className="size-3 rounded-full border"
                  style={{ backgroundColor: colours.subheading }}
                />
                <span
                  className="size-3 rounded-full border"
                  style={{ backgroundColor: colours.body }}
                />
              </div>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="quick-theme" className="field-label">
                  Preset theme
                </label>
                <div className="relative mt-2">
                  <select
                    id="quick-theme"
                    className="field-control appearance-none pr-10"
                    value={theme}
                    onChange={(e) => setTheme(e.target.value as DocumentTheme)}
                  >
                    {Object.entries(documentThemes).map(([value, item]) => (
                      <option key={value} value={value}>
                        {item.label} · {item.description}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-3 size-4 text-muted-foreground" />
                </div>
              </div>
              <div>
                <label htmlFor="quick-font" className="field-label">
                  Document font
                </label>
                <div className="relative mt-2">
                  <select
                    id="quick-font"
                    className="field-control appearance-none pr-10"
                    value={font}
                    onChange={(e) => setFont(e.target.value as DocumentFont)}
                  >
                    {Object.entries(documentFonts).map(([value, item]) => (
                      <option key={value} value={value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-3 size-4 text-muted-foreground" />
                </div>
              </div>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="header-style" className="field-label">
                  Header layout
                </label>
                <div className="relative mt-2">
                  <select
                    id="header-style"
                    className="field-control appearance-none pr-10"
                    value={headerStyle}
                    onChange={(e) =>
                      setHeaderStyle(e.target.value as DocumentHeaderStyle)
                    }
                  >
                    <option value="executive">Executive band</option>
                    <option value="classic">Classic centred</option>
                    <option value="minimal">Minimal rule</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-3 size-4 text-muted-foreground" />
                </div>
              </div>
              <div>
                <label htmlFor="subheader-style" className="field-label">
                  Subheader treatment
                </label>
                <div className="relative mt-2">
                  <select
                    id="subheader-style"
                    className="field-control appearance-none pr-10"
                    value={subheaderStyle}
                    onChange={(e) =>
                      setSubheaderStyle(
                        e.target.value as DocumentSubheaderStyle,
                      )
                    }
                  >
                    <option value="compact">Compact</option>
                    <option value="balanced">Balanced</option>
                    <option value="prominent">Prominent</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-3 size-4 text-muted-foreground" />
                </div>
              </div>
            </div>
            <fieldset className="mt-5">
              <legend className="field-label">Font colours</legend>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                {(
                  [
                    ['body', 'Body text'],
                    ['heading', 'Headers'],
                    ['subheading', 'Subheaders'],
                  ] as const
                ).map(([key, label]) => (
                  <label
                    key={key}
                    className="flex items-center gap-3 rounded-lg border border-border bg-white px-3 py-2.5 text-xs font-semibold"
                  >
                    <input
                      type="color"
                      aria-label={`${label} colour`}
                      className="size-7 cursor-pointer rounded border-0 bg-transparent p-0"
                      value={colours[key]}
                      onChange={(e) =>
                        setColours((current) => ({
                          ...current,
                          [key]: e.target.value,
                        }))
                      }
                    />
                    <span>
                      <span className="block">{label}</span>
                      <span className="mt-0.5 block font-mono text-[10px] font-normal uppercase text-muted-foreground">
                        {colours[key]}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          </div>
          {generationError && (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
            >
              {generationError}
            </div>
          )}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
            <div><p className="text-xs text-muted-foreground">Nothing is published automatically. Credits are charged only after a successful live generation.</p>{missingQuotationDetails.length>0&&<p className="mt-1 text-xs text-amber-700">Optional quotation details not supplied: {missingQuotationDetails.join(', ')}. They will be shown as not specified where applicable.</p>}</div>
            <Button
              className="h-10 gap-2 px-5"
              disabled={
                generatingJob ||
                !recipient.trim() ||
                !details.trim() ||
                quickRequirements.length === 0 ||
                (isJobPost &&
                  (!secondary.trim() || !jobPost.qualifications.trim())) ||
                (documentType === 'quotation' && (!secondary.trim() || !sender.trim()))
              }
              onClick={handleGenerate}
            >
              <WandSparkles />{' '}
              {generatingJob
                ? 'Writing and checking…'
                : `Generate ${config.noun}`}
            </Button>
          </div>
        </div>
      </section>
      <aside className="space-y-4">
        <div className="rounded-[18px] border border-border bg-card p-5">
          <p className="text-sm font-semibold">What DocBeans needs</p>
          <div className="mt-4 space-y-3">
            {config.checklist.map((item, i) => (
              <div key={item} className="flex items-center gap-3 text-xs">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-muted font-semibold">
                  {i + 1}
                </span>
                {item}
              </div>
            ))}
          </div>
        </div>
        {followUps.length > 0 && (
          <div className="rounded-[18px] border border-amber-200 bg-amber-50 p-5">
            <p className="text-sm font-semibold text-amber-950">
              Before you generate
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-4 text-xs leading-5 text-amber-900/80">
              {followUps.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        )}
        <div className="rounded-[18px] bg-primary p-5 text-primary-foreground">
          <p className="text-sm font-semibold">Quality first</p>
          <p className="mt-2 text-xs leading-5 text-white/70">
            DocBeans rewrites the brief, separates requirements and flags
            anything that still needs human confirmation.
          </p>
        </div>
      </aside>
    </div>
  );
}

function toListItems(value: string) {
  return value
    .split(/\r?\n|;|,(?=\s*[A-Za-z])/)
    .map((item) => item.replace(/^(?:[-•*]\s+|\d+[.)]\s+)/, '').trim())
    .filter(Boolean);
}

function sentenceCase(value: string) {
  const clean = value.trim().replace(/[.;,]+$/, '');
  return clean ? clean.charAt(0).toUpperCase() + clean.slice(1) : clean;
}

function lowerFirst(value: string) {
  return value ? value.charAt(0).toLowerCase() + value.slice(1) : value;
}

function toResponsibility(value: string) {
  const clean = value.trim().replace(/[.;,]+$/, '');
  if (/^ai initiatives\b/i.test(clean)) return `Lead AI${clean.slice(2)}`;
  if (/^come up with\b/i.test(clean))
    return sentenceCase(clean.replace(/^come up with/i, 'develop'));
  if (
    /^(lead|drive|identify|develop|build|deliver|define|manage|create|design|assess|advise|partner|establish|implement|support|own|translate|coordinate|monitor|evaluate)\b/i.test(
      clean,
    )
  )
    return sentenceCase(clean);
  return `Own ${lowerFirst(clean)}`;
}

function GeneratedJobPreview({
  document,
  setDocument,
  editing,
  font,
  theme,
  colours,
  headerStyle,
  subheaderStyle,
}: {
  document: GeneratedJobDocument;
  setDocument: React.Dispatch<
    React.SetStateAction<GeneratedJobDocument | null>
  >;
  editing: boolean;
  font: DocumentFont;
  theme: DocumentTheme;
  colours: DocumentColours;
  headerStyle: DocumentHeaderStyle;
  subheaderStyle: DocumentSubheaderStyle;
}) {
  const preset = documentThemes[theme];
  const update = (changes: Partial<GeneratedJobDocument>) =>
    setDocument((current) =>
      current
        ? {
            ...current,
            ...changes,
            quality: {
              ...current.quality,
              status: 'needs_review',
              score: Math.min(current.quality.score, 88),
              checks: [
                ...current.quality.checks.filter(
                  (check) => check.label !== 'Human edits',
                ),
                {
                  label: 'Human edits',
                  status: 'review',
                  message: 'Review the edited content before publishing.',
                },
              ],
            },
          }
        : current,
    );
  const listValue = (items: string[]) => items.join('\n');
  const parseList = (value: string) =>
    value
      .split(/\r?\n/)
      .map((item) => item.trim())
      .filter(Boolean);
  const fieldClass =
    'w-full rounded-md border border-input bg-white/70 px-3 py-2 text-base leading-6 shadow-sm';

  return (
    <div
      className="document-preview mx-auto max-w-[720px]"
      data-subheader-style={subheaderStyle}
      style={previewStyle(font, colours)}
    >
      {editing ? (
        <>
          <p
            className="text-xs font-semibold uppercase tracking-[.14em]"
            style={{ color: colours.subheading }}
          >
            Job description
          </p>
          <input
            aria-label="Job title"
            className={`${fieldClass} mt-3 text-2xl`}
            value={document.title}
            onChange={(e) => update({ title: e.target.value })}
          />
          <div
            className="mt-5 h-px"
            style={{ backgroundColor: colours.heading }}
          />
        </>
      ) : (
        <DocumentHeader
          label="Job description"
          title={document.title}
          font={font}
          colours={colours}
          style={headerStyle}
        />
      )}
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {editing ? (
          <input
            aria-label="Working context"
            className={fieldClass}
            value={document.context}
            onChange={(e) => update({ context: e.target.value })}
          />
        ) : (
          <p className="text-sm font-medium">{document.context}</p>
        )}
        {editing ? (
          <input
            aria-label="Organisation"
            className={fieldClass}
            value={document.organisation}
            onChange={(e) => update({ organisation: e.target.value })}
          />
        ) : (
          document.organisation && (
            <p className="text-sm sm:text-right">{document.organisation}</p>
          )
        )}
      </div>
      {(editing || document.companyUrl) && (
        <div className="mt-3 sm:text-right">
          {editing ? (
            <input
              aria-label="Company website"
              type="url"
              className={fieldClass}
              value={document.companyUrl}
              onChange={(e) => update({ companyUrl: e.target.value })}
              placeholder="https://example.com"
            />
          ) : (
            <a
              href={document.companyUrl}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-medium underline underline-offset-4"
              style={{ color: colours.subheading }}
            >
              {document.companyUrl}
            </a>
          )}
        </div>
      )}
      <div className="mt-8 space-y-7 text-base leading-7">
        <section>
          <h3 className="font-semibold">About the role</h3>
          {editing ? (
            <textarea
              aria-label="About the role"
              className={`${fieldClass} mt-2 min-h-28`}
              value={document.aboutRole}
              onChange={(e) => update({ aboutRole: e.target.value })}
            />
          ) : (
            <p className="mt-2">{document.aboutRole}</p>
          )}
        </section>
        <section>
          <h3 className="font-semibold">Key responsibilities</h3>
          {editing ? (
            <textarea
              aria-label="Key responsibilities"
              className={`${fieldClass} mt-2 min-h-44`}
              value={listValue(document.responsibilities)}
              onChange={(e) =>
                update({ responsibilities: parseList(e.target.value) })
              }
            />
          ) : (
            <ul className="mt-2 list-disc space-y-2 pl-5">
              {document.responsibilities.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
        </section>
        <section>
          <h3 className="font-semibold">Required skills and experience</h3>
          {editing ? (
            <textarea
              aria-label="Required skills and experience"
              className={`${fieldClass} mt-2 min-h-36`}
              value={listValue(document.requiredQualifications)}
              onChange={(e) =>
                update({ requiredQualifications: parseList(e.target.value) })
              }
            />
          ) : (
            <ul className="mt-2 list-disc space-y-2 pl-5">
              {document.requiredQualifications.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
        </section>
        {(editing || document.preferredQualifications.length > 0) && (
          <section>
            <h3 className="font-semibold">Preferred qualifications</h3>
            {editing ? (
              <textarea
                aria-label="Preferred qualifications"
                className={`${fieldClass} mt-2 min-h-24`}
                value={listValue(document.preferredQualifications)}
                onChange={(e) =>
                  update({ preferredQualifications: parseList(e.target.value) })
                }
              />
            ) : (
              <ul className="mt-2 list-disc space-y-2 pl-5">
                {document.preferredQualifications.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
          </section>
        )}
        {(editing || document.benefits.length > 0) && (
          <section>
            <h3 className="font-semibold">Why join us</h3>
            {editing ? (
              <textarea
                aria-label="Why join us"
                className={`${fieldClass} mt-2 min-h-24`}
                value={listValue(document.benefits)}
                onChange={(e) =>
                  update({ benefits: parseList(e.target.value) })
                }
              />
            ) : (
              <ul className="mt-2 list-disc space-y-2 pl-5">
                {document.benefits.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
          </section>
        )}
        <section>
          <h3 className="font-semibold">How to apply</h3>
          {editing ? (
            <textarea
              aria-label="How to apply"
              className={`${fieldClass} mt-2 min-h-24`}
              value={document.application}
              onChange={(e) => update({ application: e.target.value })}
            />
          ) : (
            <p className="mt-2">{document.application}</p>
          )}
        </section>
        <section
          className="border-t pt-5"
          style={{ borderColor: preset.border }}
        >
          {editing ? (
            <textarea
              aria-label="Inclusive hiring statement"
              className={`${fieldClass} min-h-20`}
              value={document.inclusiveStatement}
              onChange={(e) => update({ inclusiveStatement: e.target.value })}
            />
          ) : (
            <p className="text-sm">{document.inclusiveStatement}</p>
          )}
        </section>
      </div>
    </div>
  );
}

function UsageCard({
  usage,
  notice,
}: {
  usage: GenerationUsage;
  notice: string;
}) {
  const live = usage.mode !== 'local-fallback';
  return (
    <section
      className="xl:col-span-2 rounded-[18px] border border-border bg-card px-5 py-4"
      aria-label="Generation usage"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-lg bg-muted">
            <DollarSign className="size-4" />
          </span>
          <div>
            <p className="text-sm font-semibold">Generation usage</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {live
                ? `${usage.billingMode === 'byok' ? 'BYOK' : 'DocBeans AI'} · ${usage.mode === 'anthropic' ? 'Anthropic' : 'OpenAI'} · ${usage.model} · ${usage.inputTokens.toLocaleString()} input · ${usage.outputTokens.toLocaleString()} output tokens`
                : 'Local quality rules · no AI provider call'}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-7 text-right">
          <div>
            <p className="text-xs text-muted-foreground">Credits consumed</p>
            <p className="mt-1 text-sm font-semibold">
              {usage.credits} DocBeans credit{usage.credits === 1 ? '' : 's'}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Provider cost</p>
            <p className="mt-1 text-sm font-semibold">
              US${usage.providerCostUsd.toFixed(6)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">DocBeans charge</p>
            <p className="mt-1 text-sm font-semibold">
              SGD {usage.customerChargeSgd.toFixed(2)}
            </p>
          </div>
        </div>
      </div>
      <p className="mt-3 border-t border-border pt-3 text-[11px] leading-4 text-muted-foreground">
        {notice ||
          `Actual token usage returned by the provider. Cost calculated from the configured ${usage.model} token rates; customer pricing is shown separately.`}
      </p>
    </section>
  );
}

function DocumentHeader({
  label,
  title,
  font,
  colours,
  style,
}: {
  label: string;
  title: string;
  font: DocumentFont;
  colours: DocumentColours;
  style: DocumentHeaderStyle;
}) {
  const alignment = style === 'classic' ? 'text-center' : 'text-left';
  return (
    <header
      className={`${alignment} ${style === 'executive' ? 'border-l-4 pl-5' : ''}`}
      style={{ borderColor: colours.heading }}
    >
      <p
        className="text-xs font-semibold uppercase tracking-[.14em]"
        style={{ color: colours.subheading }}
      >
        {label}
      </p>
      <h2
        className={`${style === 'minimal' ? 'mt-2 text-2xl' : 'mt-3 text-3xl'} font-semibold leading-tight`}
        style={{
          fontFamily: documentFonts[font].family,
          color: colours.heading,
        }}
      >
        {title}
      </h2>
      <div
        className={`${style === 'classic' ? 'mx-auto mt-5 h-1 w-24' : 'mt-5 h-px'}`}
        style={{ backgroundColor: colours.heading }}
      />
    </header>
  );
}

function previewStyle(font: DocumentFont, colours: DocumentColours) {
  return {
    fontFamily: documentFonts[font].family,
    color: colours.body,
    '--doc-heading': colours.heading,
    '--doc-subheading': colours.subheading,
  } as React.CSSProperties;
}

function GeneratedQuickPreview({
  document,
  documentType,
  font,
  colours,
  headerStyle,
  subheaderStyle,
  quotationTemplateBranding,
}: {
  document: GeneratedQuickDocument;
  documentType: QuickDocumentType;
  font: DocumentFont;
  theme: DocumentTheme;
  colours: DocumentColours;
  headerStyle: DocumentHeaderStyle;
  subheaderStyle: DocumentSubheaderStyle;
  quotationTemplateBranding:WordTemplateBranding|null;
}) {
  if(documentType==='quotation'&&document.quotation)return <GeneratedQuotationPreview document={document} quotation={document.quotation} font={font} colours={colours} headerStyle={headerStyle} subheaderStyle={subheaderStyle} templateBranding={quotationTemplateBranding}/>;
  return (
    <div
      className="document-preview mx-auto max-w-[680px]"
      data-subheader-style={subheaderStyle}
      style={previewStyle(font, colours)}
    >
      <DocumentHeader
        label="DocBeans document"
        title={document.title}
        font={font}
        colours={colours}
        style={headerStyle}
      />
      <div className="mt-8 whitespace-pre-wrap text-base leading-8">
        {document.body}
      </div>
    </div>
  );
}

function GeneratedQuotationPreview({document,quotation,font,colours,headerStyle,subheaderStyle,templateBranding}:{document:GeneratedQuickDocument;quotation:GeneratedQuotation;font:DocumentFont;colours:DocumentColours;headerStyle:DocumentHeaderStyle;subheaderStyle:DocumentSubheaderStyle;templateBranding:WordTemplateBranding|null}){
  const shown=(value:string,fallback='Not provided')=>value.trim()||fallback;
  const totalRows=[['Subtotal',quotation.subtotal], [quotation.taxLabel||'Tax',quotation.taxAmount], ['Total',quotation.total]].filter(([,value])=>value.trim());
  return <div className="document-preview mx-auto max-w-[760px]" data-subheader-style={subheaderStyle} style={previewStyle(font,colours)}>
    {templateBranding&&(templateBranding.logoDataUrl||templateBranding.headerText)&&<div className="mb-7 flex items-center justify-between gap-6 border-b pb-5" style={{borderColor:colours.heading}} data-testid="quotation-template-letterhead">{templateBranding.logoDataUrl&&<img src={templateBranding.logoDataUrl} alt="Company template logo" className="max-h-16 max-w-[220px] object-contain object-left"/>}{templateBranding.headerText&&<p className="ml-auto max-w-sm whitespace-pre-line text-right text-xs leading-5 text-muted-foreground">{templateBranding.headerText}</p>}</div>}
    <DocumentHeader label="Commercial quotation" title={document.title} font={font} colours={colours} style={headerStyle}/>
    <div className="mt-7 grid gap-3 border-y border-border py-4 text-sm sm:grid-cols-4">
      {[['Quotation no.',quotation.quotationNumber],['Issue date',quotation.issueDate],['Validity',quotation.validity],['Currency',quotation.currency]].map(([label,value])=><div key={label}><span className="block text-[10px] font-semibold uppercase tracking-[.08em] text-muted-foreground">{label}</span><strong className="mt-1 block text-xs">{shown(value)}</strong></div>)}
    </div>
    <div className="mt-6 grid gap-4 sm:grid-cols-2">
      <div className="border-l-4 pl-4" style={{borderColor:colours.heading}}><span className="text-[10px] font-semibold uppercase tracking-[.08em] text-muted-foreground">Prepared for</span><p className="mt-1 font-semibold">{shown(quotation.preparedFor)}</p>{quotation.clientContact&&<p className="mt-1 whitespace-pre-line text-xs leading-5 text-muted-foreground">{quotation.clientContact}</p>}</div>
      <div className="border-l-4 pl-4" style={{borderColor:colours.subheading}}><span className="text-[10px] font-semibold uppercase tracking-[.08em] text-muted-foreground">Prepared by</span><p className="mt-1 font-semibold">{shown(quotation.preparedBy)}</p>{quotation.supplierContact&&<p className="mt-1 whitespace-pre-line text-xs leading-5 text-muted-foreground">{quotation.supplierContact}</p>}</div>
    </div>
    {document.body&&<p className="mt-6 text-sm leading-6">{document.body}</p>}
    <div className="mt-7 overflow-hidden rounded-lg border border-border">
      <table className="w-full border-collapse text-left text-xs">
        <thead style={{backgroundColor:colours.heading,color:'#fff'}}><tr><th className="px-4 py-3 font-semibold">Description</th><th className="px-3 py-3 text-center font-semibold">Qty</th><th className="px-3 py-3 text-right font-semibold">Unit price</th><th className="px-4 py-3 text-right font-semibold">Amount</th></tr></thead>
        <tbody>{quotation.items.map((item,index)=><tr key={`${item.description}-${index}`} className="border-t border-border"><td className="px-4 py-3 leading-5">{shown(item.description)}</td><td className="px-3 py-3 text-center">{shown(item.quantity,'—')}</td><td className="px-3 py-3 text-right tabular-nums">{shown(item.unitPrice,'—')}</td><td className="px-4 py-3 text-right font-semibold tabular-nums">{shown(item.amount,'—')}</td></tr>)}</tbody>
      </table>
    </div>
    {totalRows.length>0&&<div className="ml-auto mt-4 w-full max-w-xs space-y-2 text-sm">{totalRows.map(([label,value],index)=><div key={label} className={`flex justify-between gap-5 ${index===totalRows.length-1?'border-t border-border pt-3 text-base font-bold':'text-muted-foreground'}`}><span>{label}</span><span className="text-right tabular-nums text-foreground">{value}</span></div>)}</div>}
    <div className="mt-8 grid gap-6 border-t border-border pt-6 sm:grid-cols-2">
      <QuotationTerm title="Payment terms" value={quotation.paymentTerms}/><QuotationTerm title="Payment details" value={quotation.paymentDetails}/><QuotationTerm title="Delivery and scope" value={quotation.deliveryTerms}/><QuotationTerm title="Exclusions" value={quotation.exclusions}/><QuotationTerm title="Acceptance" value={quotation.acceptanceInstructions}/>
    </div>
    <div className="mt-10 grid gap-8 border-t border-border pt-7 text-xs sm:grid-cols-2"><div><div className="h-px bg-border"/><p className="mt-2 text-muted-foreground">Authorized signature</p></div><div><div className="h-px bg-border"/><p className="mt-2 text-muted-foreground">Name, date and company stamp</p></div></div>
    {templateBranding?.footerText&&<p className="mt-8 border-t border-border pt-4 text-center text-[10px] leading-4 text-muted-foreground">{templateBranding.footerText}</p>}
  </div>;
}

function QuotationTerm({title,value}:{title:string;value:string}){
  return <section><h3 className="text-xs font-semibold uppercase tracking-[.08em] text-[var(--doc-subheading)]">{title}</h3><p className="mt-2 whitespace-pre-line text-sm leading-6">{value.trim()||'Not specified in the supplied brief.'}</p></section>;
}

function QuickDraft({
  type,
  primary,
  details,
  secondary,
  sender,
  font,
  theme,
  colours,
  headerStyle,
  subheaderStyle,
  jobPost,
}: {
  type: QuickDocumentType;
  primary: string;
  details: string;
  secondary: string;
  sender: string;
  font: DocumentFont;
  theme: DocumentTheme;
  colours: DocumentColours;
  headerStyle: DocumentHeaderStyle;
  subheaderStyle: DocumentSubheaderStyle;
  jobPost: JobPostDetails;
}) {
  const byline = sender || 'Your name';
  const preset = documentThemes[theme];
  const shell = (label: string, title: string, content: React.ReactNode) => (
    <div
      className="document-preview mx-auto max-w-[680px]"
      data-subheader-style={subheaderStyle}
      style={previewStyle(font, colours)}
    >
      <DocumentHeader
        label={label}
        title={title}
        font={font}
        colours={colours}
        style={headerStyle}
      />
      <div className="mt-8 space-y-5 text-[15px] leading-7">{content}</div>
    </div>
  );
  if (type === 'appreciation')
    return shell(
      'Appreciation letter',
      'With sincere appreciation',
      <>
        <p>Dear {primary},</p>
        <p>I want to express my sincere appreciation for {details}.</p>
        <p>
          Your contribution has made a meaningful difference and is genuinely
          valued. Thank you for the care, initiative and professionalism you
          have shown.
        </p>
        <p>
          With appreciation,
          <br />
          {byline}
        </p>
      </>,
    );
  if (type === 'thank-you')
    return shell(
      'Thank-you email',
      `Thank you, ${primary}`,
      <>
        <p>Dear {primary},</p>
        <p>Thank you for {details}.</p>
        <p>
          Your support made a real difference, and I truly appreciate the time
          and care you contributed.
        </p>
        {secondary && <p>{secondary}</p>}
        <p>
          Warm regards,
          <br />
          {byline}
        </p>
      </>,
    );
  if (type === 'recommendation')
    return shell(
      'Recommendation letter',
      `Recommendation for ${primary}`,
      <>
        <p>To whom it may concern,</p>
        <p>
          I am pleased to recommend {primary}
          {secondary ? ` for ${secondary}` : ''}.
        </p>
        <p>{details}</p>
        <p>
          Based on these strengths and achievements, I recommend {primary} with
          confidence. I believe they will bring the same commitment, capability
          and positive impact to their next opportunity.
        </p>
        <p>
          Sincerely,
          <br />
          {byline}
        </p>
      </>,
    );
  if (type === 'cover-letter')
    return shell(
      'Cover letter',
      `Application for ${primary}`,
      <>
        <p>Dear {secondary || 'Hiring Manager'},</p>
        <p>
          I am writing to express my interest in {primary}. The opportunity
          strongly aligns with my experience and the contribution I am ready to
          make.
        </p>
        <p className="whitespace-pre-line">{details}</p>
        <p>
          I would welcome the opportunity to discuss how my background can
          support your team’s goals.
        </p>
        <p>
          Sincerely,
          <br />
          {byline}
        </p>
      </>,
    );
  if (type === 'quotation')
    return shell(
      'Business quotation',
      `Quotation for ${primary}`,
      <>
        <div className="grid grid-cols-2 gap-4 border-y border-border py-4 text-sm">
          <div>
            <span className="block text-xs text-muted-foreground">
              Prepared for
            </span>
            <strong>{primary}</strong>
          </div>
          <div>
            <span className="block text-xs text-muted-foreground">
              Prepared by
            </span>
            <strong>{byline}</strong>
          </div>
        </div>
        <section>
          <h3 className="font-semibold">Scope and pricing</h3>
          <p className="mt-2 whitespace-pre-line">{details}</p>
        </section>
        <section>
          <h3 className="font-semibold">Commercial terms</h3>
          <p className="mt-2">
            {secondary ||
              'Pricing and availability are subject to final confirmation. Please contact us to proceed.'}
          </p>
        </section>
      </>,
    );
  if (type === 'curriculum')
    return shell(
      'Curriculum structure',
      primary,
      <>
        <section>
          <h3 className="font-semibold">Learner profile and outcomes</h3>
          <p className="mt-2 whitespace-pre-line">{details}</p>
        </section>
        <section>
          <h3 className="font-semibold">Recommended structure</h3>
          <ol className="mt-2 list-decimal space-y-2 pl-5">
            <li>Foundations and shared vocabulary</li>
            <li>Core concepts and guided practice</li>
            <li>Applied scenarios and collaborative work</li>
            <li>Assessment, reflection and next steps</li>
          </ol>
        </section>
        <p>
          <strong>Delivery:</strong>{' '}
          {secondary || 'Duration and module count to be confirmed'}
          <br />
          <strong>Prepared by:</strong> {byline}
        </p>
      </>,
    );
  if (type === 'proposal')
    return shell(
      'Business proposal',
      `Proposal for ${primary}`,
      <>
        <section>
          <h3 className="font-semibold">Opportunity and proposed solution</h3>
          <p className="mt-2 whitespace-pre-line">{details}</p>
        </section>
        <section>
          <h3 className="font-semibold">Expected value</h3>
          <p className="mt-2">
            The proposed approach is designed to deliver a focused, measurable
            outcome while keeping implementation practical and accountable.
          </p>
        </section>
        <section>
          <h3 className="font-semibold">Commercial terms and next step</h3>
          <p className="mt-2">
            {secondary ||
              'Confirm the scope and schedule a working session to agree delivery details.'}
          </p>
        </section>
        <p>
          <strong>Prepared by:</strong> {byline}
        </p>
      </>,
    );
  if (type === 'project-brief')
    return shell(
      'Project brief',
      primary,
      <>
        <section>
          <h3 className="font-semibold">Purpose and scope</h3>
          <p className="mt-2 whitespace-pre-line">{details}</p>
        </section>
        <section>
          <h3 className="font-semibold">Delivery context</h3>
          <p className="mt-2">
            {secondary ||
              'Ownership, timeline and constraints to be confirmed during initiation.'}
          </p>
        </section>
        <section>
          <h3 className="font-semibold">Success</h3>
          <p className="mt-2">
            The project will be considered successful when agreed deliverables
            are completed, adopted and measured against the stated outcomes.
          </p>
        </section>
        <p>
          <strong>Prepared by:</strong> {byline}
        </p>
      </>,
    );
  if (type === 'executive-summary')
    return shell(
      'Executive summary',
      primary,
      <>
        <section>
          <h3 className="font-semibold">Key findings</h3>
          <p className="mt-2 whitespace-pre-line">{details}</p>
        </section>
        <section className="rounded-xl bg-muted p-4">
          <h3 className="font-semibold">Decision or action</h3>
          <p className="mt-2">
            {secondary ||
              'Review the findings and confirm the preferred next step.'}
          </p>
        </section>
        <p>
          <strong>Prepared by:</strong> {byline}
        </p>
      </>,
    );
  if (type === 'job-description') {
    const responsibilities = toListItems(details).map(toResponsibility);
    const qualifications = toListItems(jobPost.qualifications);
    return shell(
      'Job description',
      primary,
      <>
        <p
          className="text-sm font-medium"
          style={{ color: colours.subheading }}
        >
          {secondary || 'Working arrangement to be confirmed'}
        </p>
        {sender && (
          <p className="text-sm">
            <strong>{sender}</strong>
          </p>
        )}
        <section>
          <h3 className="font-semibold">About the role</h3>
          <p className="mt-2">
            As our {primary}, you will{' '}
            {lowerFirst(
              responsibilities[0] || 'lead the role’s core priorities',
            )}{' '}
            while working with stakeholders to turn business needs into
            practical, measurable outcomes.
          </p>
        </section>
        <section>
          <h3 className="font-semibold">Key responsibilities</h3>
          <ul className="mt-2 list-disc space-y-2 pl-5">
            {responsibilities.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
        <section>
          <h3 className="font-semibold">Required skills and experience</h3>
          <ul className="mt-2 list-disc space-y-2 pl-5">
            {qualifications.map((item) => (
              <li key={item}>{sentenceCase(item)}</li>
            ))}
          </ul>
        </section>
        {jobPost.benefits && (
          <section>
            <h3 className="font-semibold">Why join us</h3>
            <ul className="mt-2 list-disc space-y-2 pl-5">
              {toListItems(jobPost.benefits).map((item) => (
                <li key={item}>{sentenceCase(item)}</li>
              ))}
            </ul>
          </section>
        )}
        <section>
          <h3 className="font-semibold">How to apply</h3>
          <p className="mt-2">
            {jobPost.application ||
              'Apply through this job portal with your CV and a short note explaining your interest in the role.'}
          </p>
        </section>
        <p
          className="border-t pt-5 text-sm"
          style={{ borderColor: preset.border }}
        >
          We welcome applicants from different backgrounds who can demonstrate
          the skills and outcomes required for this role.
        </p>
      </>,
    );
  }
  if (type === 'memo')
    return shell(
      'Internal memo',
      `Memo to ${primary}`,
      <>
        <p>
          <strong>From:</strong> {byline}
        </p>
        <section>
          <h3 className="font-semibold">Purpose</h3>
          <p className="mt-2 whitespace-pre-line">{details}</p>
        </section>
        {secondary && (
          <section>
            <h3 className="font-semibold">Action and timing</h3>
            <p className="mt-2">{secondary}</p>
          </section>
        )}
      </>,
    );
  if (type === 'announcement')
    return shell(
      'Announcement',
      'Important update',
      <>
        <p>To {primary},</p>
        <p className="whitespace-pre-line">{details}</p>
        {secondary && (
          <p>
            <strong>Next step:</strong> {secondary}
          </p>
        )}
        <p>
          Thank you,
          <br />
          {byline}
        </p>
      </>,
    );
  if (type === 'meeting-agenda')
    return shell(
      'Meeting agenda',
      primary,
      <>
        <p>
          <strong>Session details:</strong> {secondary || 'To be confirmed'}
        </p>
        <section>
          <h3 className="font-semibold">Purpose and desired outcomes</h3>
          <p className="mt-2 whitespace-pre-line">{details}</p>
        </section>
        <section>
          <h3 className="font-semibold">Agenda</h3>
          <ol className="mt-2 list-decimal space-y-2 pl-5">
            <li>Welcome and objective</li>
            <li>Key discussion topics</li>
            <li>Decisions required</li>
            <li>Actions, owners and next steps</li>
          </ol>
        </section>
      </>,
    );
  if (type === 'meeting-minutes')
    return shell(
      'Meeting minutes',
      primary,
      <>
        <p>
          <strong>Attendees:</strong> {secondary || 'Not recorded'}
        </p>
        <section>
          <h3 className="font-semibold">Discussion and decisions</h3>
          <p className="mt-2 whitespace-pre-line">{details}</p>
        </section>
        <section>
          <h3 className="font-semibold">Actions</h3>
          <p className="mt-2">
            Confirm each action owner and due date before circulation.
          </p>
        </section>
      </>,
    );
  if (type === 'sop')
    return shell(
      'Standard operating procedure',
      primary,
      <>
        <p>
          <strong>Owner and references:</strong> {secondary || 'To be assigned'}
        </p>
        <section>
          <h3 className="font-semibold">Purpose</h3>
          <p className="mt-2">
            This procedure defines the consistent method for completing{' '}
            {primary}.
          </p>
        </section>
        <section>
          <h3 className="font-semibold">Procedure</h3>
          <p className="mt-2 whitespace-pre-line">{details}</p>
        </section>
        <section>
          <h3 className="font-semibold">Control</h3>
          <p className="mt-2">
            Record completion, escalate exceptions and review this procedure
            when the process changes.
          </p>
        </section>
      </>,
    );
  if (type === 'leave')
    return shell(
      'Leave request',
      'Request for leave',
      <>
        <p>Dear {primary},</p>
        <p>I am writing to request leave as follows:</p>
        <p className="whitespace-pre-line">{details}</p>
        {secondary && (
          <p>
            <strong>Reason:</strong> {secondary}
          </p>
        )}
        <p>
          I will ensure that priority work is handed over and that relevant
          colleagues have the information they need before my leave.
        </p>
        <p>
          Thank you for considering my request.
          <br />
          <br />
          Kind regards,
          <br />
          {byline}
        </p>
      </>,
    );
  if (type === 'medical-leave')
    return shell(
      'Medical leave request',
      'Medical leave notification',
      <>
        <p>Dear {primary},</p>
        <p>I am writing to request medical leave. {details}</p>
        {secondary && <p>{secondary}</p>}
        <p>
          I will share any required documentation through the appropriate
          channel and have highlighted urgent handover items to minimise
          disruption.
        </p>
        <p>
          Thank you for your understanding.
          <br />
          <br />
          Kind regards,
          <br />
          {byline}
        </p>
      </>,
    );
  return shell(
    'Testimonial',
    `Testimonial for ${primary}`,
    <>
      <blockquote className="border-l-2 border-primary pl-5 text-lg leading-8">
        “{details}”
      </blockquote>
      {secondary && (
        <p className="text-sm text-muted-foreground">
          Prepared for: {secondary}
        </p>
      )}
      <p className="font-medium">— {byline}</p>
    </>,
  );
}

function AppSidebar() {
  return (
    <aside className="hidden flex-col border-r border-border bg-white px-3 py-5 lg:flex">
      <a
        href="/create"
        className="inline-flex h-10 items-center justify-start gap-2.5 rounded-xl bg-primary px-3 text-sm font-semibold text-white"
      >
        <Plus /> New document
      </a>
      <nav aria-label="Workspace" className="mt-5 space-y-1">
        <a className="nav-link nav-link-active" href="/create">
          <FileText /> Documents
        </a>
        <a className="nav-link" href="/portal">
          <Users /> User portal
        </a>
        <a className="nav-link" href="/settings?returnTo=%2Fcreate">
          <Settings /> AI settings
        </a>
      </nav>
      <div className="mt-7 px-3 text-[11px] font-semibold uppercase tracking-[0.13em] text-muted-foreground">
        Recent
      </div>
      <div className="mt-2 space-y-1">
        <button className="recent-item">
          <span className="recent-dot bg-[#16888b]" />
          Q3 transformation brief
        </button>
        <button className="recent-item">
          <span className="recent-dot bg-[#f26b4f]" />
          Vendor assessment
        </button>
        <button className="recent-item">
          <span className="recent-dot bg-[#123f55]" />
          Launch communication
        </button>
      </div>
      <div className="mt-auto rounded-xl border border-border bg-white p-3">
        <p className="text-[11px] font-semibold text-foreground">
          DocBeans workspace
        </p>
        <div className="mt-2 flex items-center gap-2 text-[10px] text-muted-foreground">
          <ShieldCheck className="size-3" /> Protected knowledge
        </div>
      </div>
    </aside>
  );
}

type BriefProps = {
  step: number;
  documentType: AdvancedDocumentType;
  setDocumentType: (v: AdvancedDocumentType) => void;
  purpose: string;
  setPurpose: (v: string) => void;
  audience: string;
  setAudience: (v: string) => void;
  outcome: string;
  setOutcome: (v: string) => void;
  tone: string;
  setTone: (v: string) => void;
  visuals: VisualPreference;
  setVisuals: (v: VisualPreference) => void;
  trainingExerciseTypes: TrainingExerciseType[];
  setTrainingExerciseTypes: React.Dispatch<
    React.SetStateAction<TrainingExerciseType[]>
  >;
  trainingDurationValue: string;
  setTrainingDurationValue: (v: string) => void;
  trainingDurationUnit: TrainingDurationUnit;
  setTrainingDurationUnit: (v: TrainingDurationUnit) => void;
  presentationSlideCount: number;
  setPresentationSlideCount: (v: number) => void;
  proposalDetails: ProposalDetails;
  setProposalDetails: React.Dispatch<React.SetStateAction<ProposalDetails>>;
  requirements: Requirement[];
  setRequirements: React.Dispatch<React.SetStateAction<Requirement[]>>;
  newReq: string;
  setNewReq: (v: string) => void;
  addRequirement: () => void;
  sources: Source[];
  setSources: React.Dispatch<React.SetStateAction<Source[]>>;
  knowledgeNotes: string;
  setKnowledgeNotes: (v: string) => void;
  groundingMode: GroundingMode;
  setGroundingMode: (v: GroundingMode) => void;
  font: DocumentFont;
  setFont: (v: DocumentFont) => void;
  theme: DocumentTheme;
  setTheme: (v: DocumentTheme) => void;
  colours: DocumentColours;
  setColours: React.Dispatch<React.SetStateAction<DocumentColours>>;
  headerStyle: DocumentHeaderStyle;
  setHeaderStyle: (v: DocumentHeaderStyle) => void;
  subheaderStyle: DocumentSubheaderStyle;
  setSubheaderStyle: (v: DocumentSubheaderStyle) => void;
  exportFormat: ExportFormat;
  setExportFormat: (v: ExportFormat) => void;
  maxOutputTokens: number;
  setMaxOutputTokens: (v: number) => void;
  recommendedOutputTokens: number;
  recommendedExerciseTokens: number;
  documentTemplate: DocumentTemplateProfile | null;
  setDocumentTemplate: (v: DocumentTemplateProfile | null) => void;
  templateMode: TemplateApplicationMode;
  setTemplateMode: (v: TemplateApplicationMode) => void;
  onBack: () => void;
  onNext: () => void;
};

function BriefScreen(props: BriefProps) {
  const meta = stepMeta[props.step];
  const Icon = meta.icon;
  const knowledgeMissing =
    props.step === 1 &&
    !props.sources.some((source) => source.status === 'Ready') &&
    !props.knowledgeNotes.trim();
  const invalidTrainingSetup =
    props.documentType === 'training-material' &&
    (props.trainingExerciseTypes.length === 0 ||
      !Number(props.trainingDurationValue) ||
      Number(props.trainingDurationValue) <= 0);
  const invalidPresentationSetup =
    props.documentType === 'presentation' &&
    (props.presentationSlideCount < MIN_PRESENTATION_SLIDES ||
      props.presentationSlideCount > MAX_PRESENTATION_SLIDES);
  const missingProposalDetails = isProposalBrief(
    props.documentType,
    props.purpose,
    props.outcome,
  )
    ? requiredProposalDetailKeys.filter(
        (key) => !props.proposalDetails[key].trim(),
      )
    : [];
  const goalMissing =
    props.step === 0 &&
    (!props.purpose.trim() ||
      invalidTrainingSetup ||
      invalidPresentationSetup ||
      missingProposalDetails.length > 0);
  const requirementsMissing =
    props.step === 2 && props.requirements.length === 0;
  return (
    <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
      <div className="overflow-hidden rounded-[22px] border border-border bg-card shadow-[0_16px_50px_rgba(39,70,54,0.07)]">
        <div className="border-b border-border bg-[#fafafa] px-6 py-5 sm:px-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
                <Icon className="size-4" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">
                  Step {props.step + 1} of 4
                </p>
                <h2 className="text-lg font-semibold tracking-tight">
                  {
                    [
                      'Define the content goal',
                      'Upload knowledge content',
                      'Shape the content',
                      'Choose the output',
                    ][props.step]
                  }
                </h2>
              </div>
            </div>
            <span className="text-xs font-medium text-muted-foreground">
              {(props.step + 1) * 25}% complete
            </span>
          </div>
          <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${(props.step + 1) * 25}%` }}
            />
          </div>
        </div>
        <div className="p-6 sm:p-8">
          {props.step === 0 && (
            <PurposeStep
              documentType={props.documentType}
              setDocumentType={props.setDocumentType}
              purpose={props.purpose}
              setPurpose={props.setPurpose}
              audience={props.audience}
              setAudience={props.setAudience}
              outcome={props.outcome}
              setOutcome={props.setOutcome}
              tone={props.tone}
              setTone={props.setTone}
              visuals={props.visuals}
              setVisuals={props.setVisuals}
              trainingExerciseTypes={props.trainingExerciseTypes}
              setTrainingExerciseTypes={props.setTrainingExerciseTypes}
              trainingDurationValue={props.trainingDurationValue}
              setTrainingDurationValue={props.setTrainingDurationValue}
              trainingDurationUnit={props.trainingDurationUnit}
              setTrainingDurationUnit={props.setTrainingDurationUnit}
              presentationSlideCount={props.presentationSlideCount}
              setPresentationSlideCount={props.setPresentationSlideCount}
              proposalDetails={props.proposalDetails}
              setProposalDetails={props.setProposalDetails}
            />
          )}
          {props.step === 1 && (
            <KnowledgeStep
              sources={props.sources}
              setSources={props.setSources}
              knowledgeNotes={props.knowledgeNotes}
              setKnowledgeNotes={props.setKnowledgeNotes}
              groundingMode={props.groundingMode}
              setGroundingMode={props.setGroundingMode}
            />
          )}
          {props.step === 2 && (
            <RequirementsStep
              documentType={props.documentType}
              trainingExerciseTypes={props.trainingExerciseTypes}
              trainingDuration={`${props.trainingDurationValue} ${props.trainingDurationUnit}`}
              requirements={props.requirements}
              setRequirements={props.setRequirements}
              newReq={props.newReq}
              setNewReq={props.setNewReq}
              addRequirement={props.addRequirement}
            />
          )}
          {props.step === 3 && (
            <OutputStep
              font={props.font}
              setFont={props.setFont}
              theme={props.theme}
              setTheme={props.setTheme}
              colours={props.colours}
              setColours={props.setColours}
              headerStyle={props.headerStyle}
              setHeaderStyle={props.setHeaderStyle}
              subheaderStyle={props.subheaderStyle}
              setSubheaderStyle={props.setSubheaderStyle}
              exportFormat={props.exportFormat}
              setExportFormat={props.setExportFormat}
              maxOutputTokens={props.maxOutputTokens}
              setMaxOutputTokens={props.setMaxOutputTokens}
              recommendedOutputTokens={props.recommendedOutputTokens}
              recommendedExerciseTokens={props.recommendedExerciseTokens}
              documentType={props.documentType}
              documentTemplate={props.documentTemplate}
              setDocumentTemplate={props.setDocumentTemplate}
              templateMode={props.templateMode}
              setTemplateMode={props.setTemplateMode}
            />
          )}
          <div className="mt-7 flex items-center justify-between border-t border-border pt-5">
            <Button
              type="button"
              variant="ghost"
              disabled={props.step === 0}
              onClick={props.onBack}
            >
              <ArrowLeft /> Back
            </Button>
            <div className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex">
              <CheckCircle2 className="size-3.5 text-primary" /> Changes saved
            </div>
            <Button
              type="button"
              className="h-10 gap-2 px-4"
              disabled={goalMissing || knowledgeMissing || requirementsMissing}
              onClick={props.onNext}
            >
              {props.step === 3
                ? 'Review brief'
                : `Continue to ${stepMeta[props.step + 1]?.name.toLowerCase()}`}{' '}
              <ArrowRight />
            </Button>
          </div>
        </div>
      </div>
      <GroundingCard />
    </div>
  );
}

function PurposeStep({
  documentType,
  setDocumentType,
  purpose,
  setPurpose,
  audience,
  setAudience,
  outcome,
  setOutcome,
  tone,
  setTone,
  visuals,
  setVisuals,
  trainingExerciseTypes,
  setTrainingExerciseTypes,
  trainingDurationValue,
  setTrainingDurationValue,
  trainingDurationUnit,
  setTrainingDurationUnit,
  presentationSlideCount,
  setPresentationSlideCount,
  proposalDetails,
  setProposalDetails,
}: {
  documentType: AdvancedDocumentType;
  setDocumentType: (v: AdvancedDocumentType) => void;
  purpose: string;
  setPurpose: (v: string) => void;
  audience: string;
  setAudience: (v: string) => void;
  outcome: string;
  setOutcome: (v: string) => void;
  tone: string;
  setTone: (v: string) => void;
  visuals: VisualPreference;
  setVisuals: (v: VisualPreference) => void;
  trainingExerciseTypes: TrainingExerciseType[];
  setTrainingExerciseTypes: React.Dispatch<
    React.SetStateAction<TrainingExerciseType[]>
  >;
  trainingDurationValue: string;
  setTrainingDurationValue: (v: string) => void;
  trainingDurationUnit: TrainingDurationUnit;
  setTrainingDurationUnit: (v: TrainingDurationUnit) => void;
  presentationSlideCount: number;
  setPresentationSlideCount: (v: number) => void;
  proposalDetails: ProposalDetails;
  setProposalDetails: React.Dispatch<React.SetStateAction<ProposalDetails>>;
}) {
  const proposalMode = isProposalBrief(documentType, purpose, outcome);
  const completedProposalDetails = requiredProposalDetailKeys.filter((key) =>
    proposalDetails[key].trim(),
  ).length;
  return (
    <div className="space-y-6">
      <div>
        <label htmlFor="advanced-document-type" className="field-label">
          What do you want to create? <span>*</span>
        </label>
        <div className="relative mt-2">
          <select
            id="advanced-document-type"
            className="field-control appearance-none pr-10"
            value={documentType}
            onChange={(e) =>
              setDocumentType(e.target.value as AdvancedDocumentType)
            }
          >
            {Object.entries(advancedDocumentLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-3 size-4 text-muted-foreground" />
        </div>
      </div>
      {documentType === 'training-material' && (
        <div className="space-y-5 rounded-xl border border-border bg-[#fafafa] p-4 sm:p-5">
          <fieldset>
            <legend className="field-label">
              Choose exercise formats <span>*</span>
            </legend>
            <p className="field-help">
              Select one or more activities to include in the training material.
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {(
                [
                  [
                    'mcq',
                    'MCQ',
                    'Check understanding with scored questions and an answer key',
                  ],
                  [
                    'mini-project',
                    'Mini project work',
                    'Apply the learning in a practical learner deliverable',
                  ],
                  [
                    'role-play',
                    'Role play exercises',
                    'Practise decisions and conversations using a guided scenario',
                  ],
                ] as const
              ).map(([value, title, text]) => (
                <Choice
                  key={value}
                  active={trainingExerciseTypes.includes(value)}
                  title={title}
                  text={text}
                  onClick={() =>
                    setTrainingExerciseTypes((items) =>
                      items.includes(value)
                        ? items.filter((item) => item !== value)
                        : [...items, value],
                    )
                  }
                />
              ))}
            </div>
            {trainingExerciseTypes.length === 0 && (
              <p role="alert" className="mt-2 text-xs font-medium text-red-700">
                Select at least one exercise format.
              </p>
            )}
          </fieldset>
          <div>
            <label htmlFor="training-duration" className="field-label">
              Training duration <span>*</span>
            </label>
            <p className="field-help">
              The structure, activity depth and pacing will be prepared for this
              duration.
            </p>
            <div className="mt-3 grid grid-cols-[minmax(0,1fr)_140px] gap-3">
              <input
                id="training-duration"
                type="number"
                min="0.5"
                step="0.5"
                className="field-control"
                value={trainingDurationValue}
                onChange={(e) => setTrainingDurationValue(e.target.value)}
                placeholder="e.g. 2"
              />
              <select
                aria-label="Training duration unit"
                className="field-control"
                value={trainingDurationUnit}
                onChange={(e) =>
                  setTrainingDurationUnit(
                    e.target.value as TrainingDurationUnit,
                  )
                }
              >
                <option value="minutes">Minutes</option>
                <option value="hours">Hours</option>
                <option value="days">Days</option>
              </select>
            </div>
          </div>
        </div>
      )}
      {documentType === 'presentation' && (
        <div className="rounded-xl border border-border bg-[#fafafa] p-4 sm:p-5">
          <label htmlFor="presentation-slide-count" className="field-label">
            How many slides should the presentation contain? <span>*</span>
          </label>
          <p className="field-help">
            Enter the exact total, including the title slide. DocBeans will
            distribute the narrative and evidence across this count.
          </p>
          <input
            id="presentation-slide-count"
            type="number"
            min={MIN_PRESENTATION_SLIDES}
            max={MAX_PRESENTATION_SLIDES}
            step="1"
            required
            aria-required="true"
            className="field-control mt-3 max-w-40"
            value={presentationSlideCount}
            onChange={(event) =>
              setPresentationSlideCount(
                normalisePresentationSlideCount(event.target.value),
              )
            }
          />
          <p className="mt-2 text-xs text-muted-foreground">
            Choose {MIN_PRESENTATION_SLIDES}–{MAX_PRESENTATION_SLIDES} slides.
          </p>
        </div>
      )}
      <div>
        <label htmlFor="purpose" className="field-label">
          What should the {advancedDocumentLabels[documentType].toLowerCase()}{' '}
          communicate or achieve? <span>*</span>
        </label>
        <textarea
          id="purpose"
          className="field-control mt-2 min-h-24 resize-none py-3"
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
          placeholder={
            documentType === 'presentation'
              ? 'e.g. Present the business case, evidence and recommended next steps…'
              : 'Describe the subject, purpose and main message…'
          }
        />
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <label htmlFor="audience" className="field-label">
            Target audience <span>*</span>
          </label>
          <div className="relative mt-2">
            <select
              id="audience"
              className="field-control appearance-none pr-10"
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
            >
              {audienceOptions.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-3 size-4 text-muted-foreground" />
          </div>
        </div>
        <div>
          <label htmlFor="advanced-tone" className="field-label">
            Tone
          </label>
          <div className="relative mt-2">
            <select
              id="advanced-tone"
              className="field-control appearance-none pr-10"
              value={tone}
              onChange={(e) => setTone(e.target.value)}
            >
              {advancedToneOptions.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-3 size-4 text-muted-foreground" />
          </div>
        </div>
      </div>
      <div>
        <label htmlFor="outcome" className="field-label">
          Desired response or next step
        </label>
        <input
          id="outcome"
          className="field-control mt-2"
          value={outcome}
          onChange={(e) => setOutcome(e.target.value)}
          placeholder="e.g. Approve the proposal, understand the findings, or take action"
        />
      </div>
      {proposalMode && (
        <section
          className="space-y-5 rounded-xl border border-primary/25 bg-primary/[0.035] p-4 sm:p-5"
          aria-labelledby="proposal-readiness-heading"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 id="proposal-readiness-heading" className="text-sm font-semibold">
                Proposal readiness
              </h3>
              <p className="mt-1 max-w-2xl text-xs leading-5 text-muted-foreground">
                Provide the decision evidence before generation. DocBeans will
                not spend provider tokens until every required proposal input is
                complete. If something is unknown, state that it must be
                validated instead of asking the AI to invent it.
              </p>
            </div>
            <Badge
              variant="secondary"
              className={
                completedProposalDetails === requiredProposalDetailKeys.length
                  ? 'bg-emerald-50 text-emerald-800'
                  : ''
              }
            >
              {completedProposalDetails}/{requiredProposalDetailKeys.length}{' '}
              complete
            </Badge>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {requiredProposalDetailKeys.map((key) => (
              <div
                key={key}
                className={key === 'risksAssumptions' ? 'md:col-span-2' : ''}
              >
                <label htmlFor={`proposal-${key}`} className="field-label">
                  {proposalDetailLabels[key]} <span>*</span>
                </label>
                <textarea
                  id={`proposal-${key}`}
                  required
                  aria-required="true"
                  className="field-control mt-2 min-h-20 resize-y py-3"
                  value={proposalDetails[key]}
                  onChange={(event) =>
                    setProposalDetails((current) => ({
                      ...current,
                      [key]: event.target.value,
                    }))
                  }
                  placeholder={
                    key === 'clientNeed'
                      ? 'Describe the current situation, pain point, priority or opportunity and why it matters now.'
                      : key === 'proposedSolution'
                        ? 'Describe the recommended solution and how it addresses the need.'
                        : key === 'scopeDeliverables'
                          ? 'State what is included, excluded and what the client will receive.'
                          : key === 'measurableValue'
                            ? 'State expected impact, metrics, baseline or success criteria without inventing figures.'
                            : key === 'deliveryPlan'
                              ? 'Summarise phases, timing, responsibilities and milestones.'
                              : key === 'risksAssumptions'
                                ? 'List key assumptions, dependencies, risks, mitigations and likely client objections.'
                                : 'State the decision requested, decision owner and immediate next step.'
                  }
                />
              </div>
            ))}
          </div>
          <div>
            <label htmlFor="proposal-commercialTerms" className="field-label">
              {proposalDetailLabels.commercialTerms} (optional)
            </label>
            <textarea
              id="proposal-commercialTerms"
              className="field-control mt-2 min-h-20 resize-y py-3"
              value={proposalDetails.commercialTerms}
              onChange={(event) =>
                setProposalDetails((current) => ({
                  ...current,
                  commercialTerms: event.target.value,
                }))
              }
              placeholder="Provide pricing, payment terms, validity or state that commercials are excluded from this proposal."
            />
          </div>
        </section>
      )}
      <fieldset>
        <legend className="field-label">
          Should DocBeans create supporting visuals?
        </legend>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Choice
            active={visuals === 'yes'}
            title="Yes, create visuals"
            text="Build source-supported charts, diagrams, comparisons or use supplied images"
            onClick={() => setVisuals('yes')}
          />
          <Choice
            active={visuals === 'no'}
            title="No, text only"
            text="Keep the output focused on written content"
            onClick={() => setVisuals('no')}
          />
        </div>
      </fieldset>
      <InfoBox icon={Sparkles} title="Content fit">
        DocBeans will structure the output as a{' '}
        {advancedDocumentLabels[documentType].toLowerCase()}, not as training
        material unless you select it.
      </InfoBox>
    </div>
  );
}

function RequirementsStep({
  documentType,
  trainingExerciseTypes,
  trainingDuration,
  requirements,
  setRequirements,
  newReq,
  setNewReq,
  addRequirement,
}: {
  documentType: AdvancedDocumentType;
  trainingExerciseTypes: TrainingExerciseType[];
  trainingDuration: string;
  requirements: Requirement[];
  setRequirements: React.Dispatch<React.SetStateAction<Requirement[]>>;
  newReq: string;
  setNewReq: (v: string) => void;
  addRequirement: () => void;
}) {
  const suggestions = requirementSuggestions(
    documentType,
    trainingExerciseTypes,
    trainingDuration,
  );
  const addSuggested = (text: string) => {
    if (!text || requirements.some((item) => item.text === text)) return;
    setRequirements((items) => [
      ...items,
      { id: Date.now(), text, mandatory: true },
    ]);
  };
  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h3 className="field-label">
            Trackable requirements <span>*</span>
          </h3>
          <p className="field-help">
            Choose suggested requirements or add your own. Every mandatory item
            is checked in the draft.
          </p>
        </div>
        <Badge variant="secondary">{requirements.length} items</Badge>
      </div>
      <div className="mt-5 rounded-xl border border-border bg-[#fafafa] p-4">
        <label htmlFor="suggested-requirement" className="field-label">
          Suggested requirements
        </label>
        <div className="relative mt-2">
          <select
            id="suggested-requirement"
            className="field-control appearance-none pr-10"
            value=""
            onChange={(e) => addSuggested(e.target.value)}
          >
            <option value="">Choose a requirement to add…</option>
            {suggestions.map((item) => (
              <option
                key={item}
                value={item}
                disabled={requirements.some((req) => req.text === item)}
              >
                {item}
                {requirements.some((req) => req.text === item)
                  ? ' · Added'
                  : ''}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-3 size-4 text-muted-foreground" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        {requirements.map((req, i) => (
          <div
            key={req.id}
            className="group flex items-start gap-3 rounded-xl border border-border bg-[#fafafa] p-3.5"
          >
            <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-primary/10 text-[11px] font-semibold text-primary">
              {i + 1}
            </span>
            <p className="flex-1 pt-1 text-sm leading-5">{req.text}</p>
            <button
              aria-label={`Delete ${req.text}`}
              onClick={() =>
                setRequirements((items) => items.filter((r) => r.id !== req.id))
              }
              className="mt-0.5 rounded-md p-1 text-muted-foreground opacity-50 transition hover:bg-red-50 hover:text-destructive group-hover:opacity-100"
            >
              <Trash2 className="size-3.5" />
            </button>
            <button
              onClick={() =>
                setRequirements((items) =>
                  items.map((r) =>
                    r.id === req.id ? { ...r, mandatory: !r.mandatory } : r,
                  ),
                )
              }
              className={`mt-0.5 rounded-full px-2 py-1 text-[10px] font-semibold ${req.mandatory ? 'bg-[#ececea] text-primary' : 'bg-muted text-muted-foreground'}`}
            >
              {req.mandatory ? 'Must' : 'Optional'}
            </button>
          </div>
        ))}
      </div>
      <div className="mt-5">
        <label htmlFor="custom-requirement" className="field-label">
          Custom requirement
        </label>
        <p className="field-help">
          Add a requirement that is specific to your content, audience or
          organisation.
        </p>
        <div className="mt-2 flex gap-2">
          <input
            id="custom-requirement"
            aria-label="Custom requirement"
            className="field-control"
            placeholder="Type a custom requirement…"
            value={newReq}
            onChange={(e) => setNewReq(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addRequirement();
              }
            }}
          />
          <Button
            aria-label="Add custom requirement"
            variant="outline"
            size="icon-lg"
            onClick={addRequirement}
          >
            <Plus />
          </Button>
        </div>
      </div>
      <InfoBox icon={ClipboardCheck} title="Coverage promise" className="mt-6">
        Silent omission is not allowed. DocBeans will show each requirement as
        addressed or requiring human review.
      </InfoBox>
    </div>
  );
}

function OutputStep({
  font,
  setFont,
  theme,
  setTheme,
  colours,
  setColours,
  headerStyle,
  setHeaderStyle,
  subheaderStyle,
  setSubheaderStyle,
  exportFormat,
  setExportFormat,
  maxOutputTokens,
  setMaxOutputTokens,
  recommendedOutputTokens,
  recommendedExerciseTokens,
  documentType,
  documentTemplate,
  setDocumentTemplate,
  templateMode,
  setTemplateMode,
}: {
  font: DocumentFont;
  setFont: (v: DocumentFont) => void;
  theme: DocumentTheme;
  setTheme: (v: DocumentTheme) => void;
  colours: DocumentColours;
  setColours: React.Dispatch<React.SetStateAction<DocumentColours>>;
  headerStyle: DocumentHeaderStyle;
  setHeaderStyle: (v: DocumentHeaderStyle) => void;
  subheaderStyle: DocumentSubheaderStyle;
  setSubheaderStyle: (v: DocumentSubheaderStyle) => void;
  exportFormat: ExportFormat;
  setExportFormat: (v: ExportFormat) => void;
  maxOutputTokens: number;
  setMaxOutputTokens: (v: number) => void;
  recommendedOutputTokens: number;
  recommendedExerciseTokens: number;
  documentType: AdvancedDocumentType;
  documentTemplate: DocumentTemplateProfile | null;
  setDocumentTemplate: (v: DocumentTemplateProfile | null) => void;
  templateMode: TemplateApplicationMode;
  setTemplateMode: (v: TemplateApplicationMode) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <label htmlFor="advanced-download-type" className="field-label">
          Download type <span>*</span>
        </label>
        <div className="relative mt-2">
          <select
            id="advanced-download-type"
            className="field-control appearance-none pr-10"
            value={exportFormat}
            onChange={(e) => setExportFormat(e.target.value as ExportFormat)}
          >
            <option value="pptx">PowerPoint (.pptx)</option>
            <option value="pdf">PDF (.pdf)</option>
            <option value="docx">Word (.docx)</option>
            <option value="txt">Plain text (.txt)</option>
            <option value="xlsx">Excel (.xlsx)</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-3 size-4 text-muted-foreground" />
        </div>
      </div>
      <div className="rounded-xl border border-border bg-white p-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <label htmlFor="advanced-output-budget" className="field-label">
              {documentType === 'training-material'
                ? 'Per-topic output allowance'
                : 'AI output budget'}
            </label>
            <p className="field-help">
              {documentType === 'training-material'
                ? 'Maximum for each independently generated topic deck; the course has no fixed slide limit.'
                : 'Maximum tokens the provider may use to complete the structured document.'}
            </p>
          </div>
          <button
            type="button"
            className="text-xs font-semibold text-primary underline underline-offset-4"
            onClick={() => setMaxOutputTokens(recommendedOutputTokens)}
          >
            Use recommended {recommendedOutputTokens.toLocaleString()}
          </button>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_130px]">
          <input
            id="advanced-output-budget"
            type="range"
            min="4000"
            max="24000"
            step="1000"
            value={maxOutputTokens}
            onChange={(e) => setMaxOutputTokens(Number(e.target.value))}
          />
          <input
            aria-label="Maximum output tokens"
            type="number"
            min="4000"
            max="24000"
            step="1000"
            className="field-control text-right"
            value={maxOutputTokens}
            onChange={(e) =>
              setMaxOutputTokens(
                clampOutputTokens(Number(e.target.value) || 4000),
              )
            }
          />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {documentType === 'training-material' ? (
            <>
              Expected topic output:{' '}
              {Math.max(4000, recommendedOutputTokens - 5000).toLocaleString()}–
              {Math.max(4000, recommendedOutputTokens - 2000).toLocaleString()}{' '}
              tokens. Recommended maximum per topic:{' '}
              {recommendedOutputTokens.toLocaleString()}. DocBeans plans the
              course, creates each topic separately and then assembles the
              complete package. Exercises use a separate{' '}
              {recommendedExerciseTokens.toLocaleString()}-token maximum after
              approval.
            </>
          ) : (
            <>
              Recommended for this brief:{' '}
              {recommendedOutputTokens.toLocaleString()} tokens. Higher limits
              increase the maximum possible provider cost; actual use can be
              lower.
            </>
          )}
        </p>
      </div>
      <TemplateUploader
        template={documentTemplate}
        setTemplate={setDocumentTemplate}
        mode={templateMode}
        setMode={setTemplateMode}
      />
      <div className="rounded-xl border border-border bg-[#fafafa] p-4 sm:p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold">Document design</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Apply the same professional controls available in Quick Document.
            </p>
          </div>
          <div className="flex gap-1.5" aria-hidden="true">
            <span
              className="size-3 rounded-full border"
              style={{ backgroundColor: colours.heading }}
            />
            <span
              className="size-3 rounded-full border"
              style={{ backgroundColor: colours.subheading }}
            />
            <span
              className="size-3 rounded-full border"
              style={{ backgroundColor: colours.body }}
            />
          </div>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="advanced-theme" className="field-label">
              Preset theme
            </label>
            <div className="relative mt-2">
              <select
                id="advanced-theme"
                className="field-control appearance-none pr-10"
                value={theme}
                onChange={(e) => setTheme(e.target.value as DocumentTheme)}
              >
                {Object.entries(documentThemes).map(([value, item]) => (
                  <option key={value} value={value}>
                    {item.label} · {item.description}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-3 size-4 text-muted-foreground" />
            </div>
          </div>
          <div>
            <label htmlFor="advanced-font" className="field-label">
              Document font
            </label>
            <div className="relative mt-2">
              <select
                id="advanced-font"
                className="field-control appearance-none pr-10"
                value={font}
                onChange={(e) => setFont(e.target.value as DocumentFont)}
              >
                {Object.entries(documentFonts).map(([value, item]) => (
                  <option key={value} value={value}>
                    {item.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-3 size-4 text-muted-foreground" />
            </div>
          </div>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="advanced-header-style" className="field-label">
              Header layout
            </label>
            <select
              id="advanced-header-style"
              className="field-control mt-2"
              value={headerStyle}
              onChange={(e) =>
                setHeaderStyle(e.target.value as DocumentHeaderStyle)
              }
            >
              <option value="executive">Executive band</option>
              <option value="classic">Classic centred</option>
              <option value="minimal">Minimal rule</option>
            </select>
          </div>
          <div>
            <label htmlFor="advanced-subheader-style" className="field-label">
              Subheader treatment
            </label>
            <select
              id="advanced-subheader-style"
              className="field-control mt-2"
              value={subheaderStyle}
              onChange={(e) =>
                setSubheaderStyle(e.target.value as DocumentSubheaderStyle)
              }
            >
              <option value="compact">Compact</option>
              <option value="balanced">Balanced</option>
              <option value="prominent">Prominent</option>
            </select>
          </div>
        </div>
        <fieldset className="mt-5">
          <legend className="field-label">Font colours</legend>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {(
              [
                ['body', 'Body text'],
                ['heading', 'Headers'],
                ['subheading', 'Subheaders'],
              ] as const
            ).map(([key, label]) => (
              <label
                key={key}
                className="flex items-center gap-3 rounded-lg border border-border bg-white px-3 py-2.5 text-xs font-semibold"
              >
                <input
                  type="color"
                  aria-label={`${label} colour`}
                  className="size-7 cursor-pointer rounded border-0 bg-transparent p-0"
                  value={colours[key]}
                  onChange={(e) =>
                    setColours((current) => ({
                      ...current,
                      [key]: e.target.value,
                    }))
                  }
                />
                <span>
                  <span className="block">{label}</span>
                  <span className="mt-0.5 block font-mono text-[10px] font-normal uppercase text-muted-foreground">
                    {colours[key]}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      </div>
      <InfoBox icon={ShieldCheck} title="Format check">
        The generated structure must match the selected document type.
        Presentation downloads contain developed slides and editable evidence
        visuals, never visual suggestion placeholders.
      </InfoBox>
    </div>
  );
}

function QuotationTemplateUploader({template,onTemplate}:{template:DocumentTemplateProfile|null;onTemplate:(template:DocumentTemplateProfile|null,file:File|null,branding:WordTemplateBranding|null)=>void}){
  const [reading,setReading]=useState(false);
  const [error,setError]=useState('');
  const addTemplate=async(file?:File)=>{
    if(!file)return;
    setReading(true);setError('');
    try{
      if(file.size>20*1024*1024)throw new Error('The company template must be 20 MB or smaller.');
      if(file.name.split('.').pop()?.toLowerCase()!=='docx')throw new Error('Upload a Word (.docx) company template.');
      const [profile,branding]=await Promise.all([extractDocumentTemplate(file),extractWordTemplateBranding(file)]);
      if(profile.format!=='docx')throw new Error('Upload a Word (.docx) company template.');
      onTemplate(profile,file,branding);
    }catch(reason){
      onTemplate(null,null,null);
      setError(reason instanceof Error?reason.message:'The company template could not be analysed.');
    }finally{setReading(false);}
  };
  return <section className="rounded-xl border border-border bg-[#fafafa] p-4 sm:p-5">
    <div className="flex items-start justify-between gap-4"><div><p className="text-sm font-semibold">Company quotation template <span className="font-normal text-muted-foreground">(optional)</span></p><p className="mt-1 text-xs leading-5 text-muted-foreground">Upload a Word template. DOCX downloads preserve its letterhead, logo, headers, footers, margins and page setup; the browser preview and PDF reproduce its detected font and colours. Template wording is never used as quotation evidence.</p></div><LayoutTemplate className="size-5 shrink-0 text-primary"/></div>
    {!template?<label className={`mt-4 flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-primary/35 bg-white px-5 py-6 text-center transition hover:bg-[#f7f7f5] ${reading?'pointer-events-none opacity-60':''}`}><UploadCloud className="size-5 text-primary"/><span className="mt-2 text-sm font-semibold">{reading?'Analysing company template…':'Upload company template'}</span><span className="mt-1 text-xs text-muted-foreground">Word (.docx) · optional · maximum 20 MB</span><input type="file" accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="sr-only" disabled={reading} onChange={event=>{const file=event.target.files?.[0];event.target.value='';void addTemplate(file);}}/></label>:
      <div className="mt-4 rounded-xl border border-border bg-white p-4"><div className="flex items-start gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><FileText className="size-4"/></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{template.name}</p><p className="mt-1 text-xs text-muted-foreground">{template.design.fontFamily} · original Word package and visible letterhead retained</p><div className="mt-2 flex gap-1.5" aria-label="Detected company template colours">{[template.design.headingColor,...template.design.accentColors.slice(0,3),template.design.backgroundColor].map((colour,index)=><span key={`${colour}-${index}`} className="size-4 rounded-full border border-black/10" style={{backgroundColor:colour}}/>)}</div></div><button type="button" aria-label="Remove company template" onClick={()=>onTemplate(null,null,null)} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"><X className="size-4"/></button></div><p className="mt-3 text-[11px] leading-5 text-muted-foreground">DOCX export retains Word headers, footers and body-level logo artwork. The on-screen quotation displays the extracted letterhead preview; complex Word-only positioning may still differ.</p></div>}
    {error&&<p role="alert" className="mt-2 text-xs leading-5 text-red-700">{error}</p>}
  </section>;
}

function TemplateUploader({
  template,
  setTemplate,
  mode,
  setMode,
}: {
  template: DocumentTemplateProfile | null;
  setTemplate: (v: DocumentTemplateProfile | null) => void;
  mode: TemplateApplicationMode;
  setMode: (v: TemplateApplicationMode) => void;
}) {
  const [reading, setReading] = useState(false);
  const [error, setError] = useState('');
  const addTemplate = async (file?: File) => {
    if (!file) return;
    setReading(true);
    setError('');
    try {
      setTemplate(await extractDocumentTemplate(file));
    } catch (reason) {
      setTemplate(null);
      setError(
        reason instanceof Error
          ? reason.message
          : 'The template could not be analysed.',
      );
    } finally {
      setReading(false);
    }
  };
  return (
    <section className="rounded-xl border border-border bg-[#fafafa] p-4 sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold">
            Document template{' '}
            <span className="font-normal text-muted-foreground">
              (optional)
            </span>
          </p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Upload a PowerPoint or Word example. DocBeans analyses its structure
            and design separately from factual knowledge.
          </p>
        </div>
        <LayoutTemplate className="size-5 shrink-0 text-primary" />
      </div>
      {!template ? (
        <label
          className={`mt-4 flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-primary/35 bg-white px-5 py-6 text-center transition hover:bg-[#f7f7f5] ${reading ? 'pointer-events-none opacity-60' : ''}`}
        >
          <UploadCloud className="size-5 text-primary" />
          <span className="mt-2 text-sm font-semibold">
            {reading ? 'Analysing template…' : 'Upload template'}
          </span>
          <span className="mt-1 text-xs text-muted-foreground">
            PowerPoint (.pptx) or Word (.docx)
          </span>
          <input
            type="file"
            accept=".pptx,.docx"
            className="sr-only"
            disabled={reading}
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = '';
              void addTemplate(file);
            }}
          />
        </label>
      ) : (
        <div className="mt-4 rounded-xl border border-border bg-white p-4">
          <div className="flex items-start gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
              <FileText className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{template.name}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {template.structure.unitCount} {template.structure.unitLabel} ·{' '}
                {template.design.fontFamily} · {template.design.aspectRatio}
              </p>
              <div
                className="mt-2 flex gap-1.5"
                aria-label="Detected template colours"
              >
                {[
                  template.design.headingColor,
                  ...template.design.accentColors.slice(0, 3),
                  template.design.backgroundColor,
                ].map((colour, index) => (
                  <span
                    key={`${colour}-${index}`}
                    className="size-4 rounded-full border border-black/10"
                    style={{ backgroundColor: colour }}
                  />
                ))}
              </div>
            </div>
            <button
              type="button"
              aria-label="Remove template"
              onClick={() => setTemplate(null)}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          </div>
          <fieldset className="mt-4">
            <legend className="field-label">Apply template to</legend>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {(
                [
                  [
                    'structure',
                    'Content format',
                    'Follow its section or slide sequence',
                  ],
                  [
                    'design',
                    'Design only',
                    'Use its detected fonts and colours',
                  ],
                  [
                    'both',
                    'Content + design',
                    'Apply both structure and appearance',
                  ],
                ] as const
              ).map(([value, title, description]) => (
                <Choice
                  key={value}
                  active={mode === value}
                  title={title}
                  text={description}
                  onClick={() => setMode(value)}
                />
              ))}
            </div>
          </fieldset>
          <p className="mt-3 text-[11px] leading-5 text-muted-foreground">
            {template.limitations}
          </p>
        </div>
      )}
      {error && (
        <p role="alert" className="mt-2 text-xs leading-5 text-red-700">
          {error}
        </p>
      )}
    </section>
  );
}

function KnowledgeStep({
  sources,
  setSources,
  knowledgeNotes,
  setKnowledgeNotes,
  groundingMode,
  setGroundingMode,
}: {
  sources: Source[];
  setSources: React.Dispatch<React.SetStateAction<Source[]>>;
  knowledgeNotes: string;
  setKnowledgeNotes: (v: string) => void;
  groundingMode: GroundingMode;
  setGroundingMode: (v: GroundingMode) => void;
}) {
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [websiteError, setWebsiteError] = useState('');
  const [sourceLimitError, setSourceLimitError] = useState('');
  const [fetchingWebsite, setFetchingWebsite] = useState(false);
  const addFile = async (file?: File) => {
    if (!file) return;
    const id = Date.now() + Math.floor(Math.random() * 1000),
      size = `${Math.max(1, Math.round(file.size / 1024))} KB`;
    setSources((items) => [
      ...items,
      {
        id,
        name: file.name,
        meta: `${size} · Reading content…`,
        status: 'Checking',
        mimeType: file.type,
        kind: 'text',
        content: '',
        sizeBytes: file.size,
      },
    ]);
    try {
      const extracted = await extractKnowledgeFile(file);
      if (!extracted.content.trim() && !extracted.dataUrl)
        throw new Error('No readable content was found.');
      const chunkCount =
        extracted.kind === 'text'
          ? await storeKnowledgeContent(id, extracted.content)
          : undefined;
      setSources((items) =>
        items.map((source) =>
          source.id === id
            ? {
                ...source,
                ...extracted,
                content: extracted.kind === 'text' ? '' : extracted.content,
                chunkCount,
                meta: `${size} · ${extracted.kind === 'image' ? 'Optimised image ready for AI analysis' : `${extracted.content.length.toLocaleString()} characters · ${chunkCount} searchable chunks`}`,
                status: 'Ready',
              }
            : source,
        ),
      );
    } catch (error) {
      setSources((items) =>
        items.map((source) =>
          source.id === id
            ? {
                ...source,
                meta:
                  error instanceof Error
                    ? error.message
                    : 'The file could not be read.',
                status: 'Error',
                sizeBytes: 0,
              }
            : source,
        ),
      );
    }
  };
  const addWebsite = async () => {
    const entered = websiteUrl.trim();
    if (!entered) return;
    if (sources.length >= MAX_KNOWLEDGE_FILES) {
      setWebsiteError(
        `Remove a source before adding another. The limit is ${MAX_KNOWLEDGE_FILES}.`,
      );
      return;
    }
    setWebsiteError('');
    setFetchingWebsite(true);
    try {
      const response = await fetch('/api/fetch-website', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: entered }),
      });
      const payload = (await response.json()) as {
        source?: Omit<Source, 'id' | 'status'>;
        error?: string;
      };
      if (!response.ok || !payload.source)
        throw new Error(
          payload.error || 'DocBeans could not fetch this website.',
        );
      if (sources.some((source) => source.url === payload.source?.url))
        throw new Error('This website is already in the approved sources.');
      const id = Date.now() + Math.floor(Math.random() * 1000),
        chunkCount = await storeKnowledgeContent(id, payload.source.content);
      setSources((items) => [
        ...items,
        {
          ...payload.source!,
          id,
          status: 'Ready',
          content: '',
          chunkCount,
          meta: `Website · ${payload.source!.content.length.toLocaleString()} characters · ${chunkCount} searchable chunks`,
        },
      ]);
      setWebsiteUrl('');
    } catch (error) {
      setWebsiteError(
        error instanceof Error
          ? error.message
          : 'DocBeans could not fetch this website.',
      );
    } finally {
      setFetchingWebsite(false);
    }
  };
  const removeSource = (source: Source) => {
    setSources((items) => items.filter((item) => item.id !== source.id));
    void removeKnowledgeContent(source.id);
  };
  const readyCount = sources.filter(
    (source) => source.status === 'Ready',
  ).length;
  const uploadedBytes = sources.reduce(
    (total, source) => total + (source.sizeBytes || 0),
    0,
  );
  const uploadPercent = Math.min(
    100,
    (uploadedBytes / MAX_TOTAL_UPLOAD_BYTES) * 100,
  );
  return (
    <div className="space-y-6">
      <fieldset>
        <legend className="field-label">
          Grounding mode <span>*</span>
        </legend>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Choice
            active={groundingMode === 'approved-only'}
            title="Approved sources only"
            text="Use uploaded documents, pasted notes and website URLs you approve"
            onClick={() => setGroundingMode('approved-only')}
          />
          <Choice
            active={groundingMode === 'approved-plus-web'}
            title="Approved sources + external websites"
            text="Also allow the selected AI provider to search relevant public websites"
            onClick={() => setGroundingMode('approved-plus-web')}
          />
        </div>
      </fieldset>
      <div>
        <div className="flex items-center justify-between">
          <p className="field-label">Approved knowledge sources</p>
          <span className="text-xs text-muted-foreground">
            {readyCount} ready · {sources.length}/{MAX_KNOWLEDGE_FILES}
          </span>
        </div>
        <p className="field-help">
          Upload documents or fetch a website URL. Large text sources are
          indexed locally and relevant excerpts are selected during generation.
        </p>
        <div className="mt-3 rounded-xl border border-border bg-white p-3">
          <div className="flex items-center justify-between gap-4 text-xs">
            <span className="font-medium">Combined uploads</span>
            <span className="text-muted-foreground">
              {formatUploadSize(uploadedBytes)} of{' '}
              {formatUploadSize(MAX_TOTAL_UPLOAD_BYTES)}
            </span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${uploadPercent}%` }}
            />
          </div>
        </div>
        <label
          className={`mt-3 flex flex-col items-center justify-center rounded-2xl border border-dashed border-primary/35 bg-[#f7f7f5] px-6 py-6 text-center transition ${sources.length >= MAX_KNOWLEDGE_FILES || uploadedBytes >= MAX_TOTAL_UPLOAD_BYTES ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:bg-[#f4f4f2]'}`}
        >
          <UploadCloud className="size-6 text-primary" />
          <span className="mt-2 text-sm font-semibold">
            Upload reference files
          </span>
          <span className="mt-1 text-xs text-muted-foreground">
            PDF, DOCX, PPTX, XLSX, TXT or image · 500 MB combined allowance · no
            separate per-file cap
          </span>
          <input
            type="file"
            multiple
            disabled={
              sources.length >= MAX_KNOWLEDGE_FILES ||
              uploadedBytes >= MAX_TOTAL_UPLOAD_BYTES
            }
            accept=".pdf,.docx,.pptx,.xlsx,.xls,.txt,.md,.csv,.json,image/*"
            className="sr-only"
            onChange={(e) => {
              const files = Array.from(e.target.files ?? []),
                remainingSlots = MAX_KNOWLEDGE_FILES - sources.length,
                remainingBytes = MAX_TOTAL_UPLOAD_BYTES - uploadedBytes,
                accepted: File[] = [];
              let selectedBytes = 0;
              for (const file of files) {
                if (
                  accepted.length >= remainingSlots ||
                  selectedBytes + file.size > remainingBytes
                )
                  continue;
                accepted.push(file);
                selectedBytes += file.size;
              }
              const omitted = files.length - accepted.length;
              setSourceLimitError(
                omitted
                  ? `${omitted} file${omitted === 1 ? ' was' : 's were'} not added because the combined 500 MB or 100-source allowance would be exceeded.`
                  : '',
              );
              e.target.value = '';
              void (async () => {
                for (const file of accepted) await addFile(file);
              })();
            }}
          />
        </label>
        {sourceLimitError && (
          <p role="alert" className="mt-2 text-xs leading-5 text-red-700">
            {sourceLimitError}
          </p>
        )}
        <div className="mt-4 rounded-xl border border-border bg-[#fafafa] p-4">
          <label htmlFor="approved-website" className="field-label">
            Fetch an approved website
          </label>
          <p className="field-help">
            Enter the exact public page DocBeans may use as evidence.
          </p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input
              id="approved-website"
              type="url"
              className="field-control"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  void addWebsite();
                }
              }}
              placeholder="https://example.com/research"
            />
            <Button
              type="button"
              variant="outline"
              className="shrink-0"
              onClick={() => void addWebsite()}
              disabled={fetchingWebsite || !websiteUrl.trim()}
            >
              {fetchingWebsite ? (
                <span className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <Globe2 />
              )}{' '}
              {fetchingWebsite ? 'Fetching…' : 'Fetch website'}
            </Button>
          </div>
          {websiteError && (
            <p role="alert" className="mt-2 text-xs leading-5 text-red-700">
              {websiteError}
            </p>
          )}
        </div>
        <div
          className="mt-3 max-h-[420px] space-y-2 overflow-y-auto pr-1"
          aria-live="polite"
        >
          {sources.map((source) => (
            <div
              key={source.id}
              className="flex items-center gap-3 rounded-xl border border-border bg-white p-3"
            >
              <span className="grid size-9 place-items-center rounded-lg bg-muted text-primary">
                {source.kind === 'website' ? (
                  <Globe2 className="size-4" />
                ) : (
                  <FileText className="size-4" />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">
                  {source.name}
                </span>
                <span
                  className={`block truncate text-[11px] ${source.status === 'Error' ? 'text-red-700' : 'text-muted-foreground'}`}
                >
                  {source.url || source.meta}
                </span>
              </span>
              <Badge
                className={
                  source.status === 'Error'
                    ? 'bg-red-50 text-red-800'
                    : 'bg-[#ececea] text-primary'
                }
              >
                {source.status === 'Ready' ? (
                  <Check className="size-3" />
                ) : source.status === 'Checking' ? (
                  <span className="size-3 animate-spin rounded-full border border-current border-t-transparent" />
                ) : (
                  <X className="size-3" />
                )}{' '}
                {source.status}
              </Badge>
              <button
                type="button"
                aria-label={`Remove ${source.name}`}
                onClick={() => removeSource(source)}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
      <div>
        <label htmlFor="knowledge-notes" className="field-label">
          Paste knowledge or working notes
        </label>
        <textarea
          id="knowledge-notes"
          className="field-control mt-2 min-h-32 resize-y py-3"
          value={knowledgeNotes}
          onChange={(e) => setKnowledgeNotes(e.target.value)}
          placeholder="Paste source text, research notes, meeting notes or key facts…"
        />
        <p className="field-help">
          Add at least one readable source or paste source content here to
          continue.
        </p>
      </div>
      <InfoBox icon={ShieldCheck} title="Source control">
        {groundingMode === 'approved-only'
          ? 'The provider receives only relevant excerpts from the files, notes and website pages you approved.'
          : 'Relevant approved-source excerpts are sent first; the provider may then supplement them with public web research. External URLs are retained in the source trace.'}
      </InfoBox>
    </div>
  );
}

function GroundingCard() {
  return (
    <aside className="space-y-4 xl:col-start-2">
      <div className="rounded-[20px] bg-[#161616] p-5 text-white shadow-lg shadow-emerald-950/10">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-[#d6d6d2]" />
          <h2 className="text-sm font-semibold">Grounded by design</h2>
        </div>
        <p className="mt-3 text-xs leading-5 text-white/70">
          Your draft uses the knowledge you authorize, with visible source and
          requirement checks before export.
        </p>
        <div className="mt-4 flex items-center gap-2 text-[11px] font-medium text-[#d6d6d2]">
          <span className="size-1.5 rounded-full bg-[#d6d6d2]" /> Human review
          required
        </div>
      </div>
    </aside>
  );
}

function CoursePlanScreen({
  plan,
  setPlan,
  maxOutputTokens,
  aiSettings,
  completedTopicCount,
  generationProgress,
  generating,
  error,
  usage,
  notice,
  onBack,
  onApprove,
}: {
  plan: CoursePlan;
  setPlan: React.Dispatch<React.SetStateAction<CoursePlan | null>>;
  maxOutputTokens:number;
  aiSettings:AiSettings;
  completedTopicCount:number;
  generationProgress:string;
  generating: boolean;
  error: string;
  usage: GenerationUsage | null;
  notice: string;
  onBack: () => void;
  onApprove: () => void;
}) {
  const updateTopic = (
    index: number,
    patch: Partial<CoursePlan['topics'][number]>,
  ) =>
    setPlan((current) =>
      current
        ? {
            ...current,
            topics: current.topics.map((topic, topicIndex) =>
              topicIndex === index ? { ...topic, ...patch } : topic,
            ),
          }
        : current,
    );
  const moveTopic = (index: number, direction: -1 | 1) =>
    setPlan((current) => {
      if (!current) return current;
      const target = index + direction;
      if (target < 0 || target >= current.topics.length) return current;
      const topics = [...current.topics];
      [topics[index], topics[target]] = [topics[target], topics[index]];
      return { ...current, topics };
    });
  const removeTopic = (index: number) =>
    setPlan((current) =>
      current && current.topics.length > 2
        ? {
            ...current,
            topics: current.topics.filter(
              (_, topicIndex) => topicIndex !== index,
            ),
          }
        : current,
    );
  const addTopic = () =>
    setPlan((current) =>
      current
        ? {
            ...current,
            topics: [
              ...current.topics,
              {
                title: 'New topic',
                purpose: 'Describe what learners will achieve in this topic.',
                durationMinutes: 30,
                outcomes: [
                  'Apply the topic in a relevant workplace situation.',
                ],
              },
            ],
          }
        : current,
    );
  const totalMinutes = plan.topics.reduce(
    (total, topic) => total + topic.durationMinutes,
    0,
  );
  const model=llmModels[aiSettings.provider].find(item=>item.value===aiSettings.model)||llmModels[aiSettings.provider][0];
  const maximumOutputTokens=plan.topics.length*maxOutputTokens;
  const maximumOutputCost=maximumOutputTokens*model.outputUsdPerMillion/1_000_000;
  const valid =
    Boolean(plan.title.trim())&&plan.topics.length >= 2 &&
    plan.topics.every(
      (topic) =>
        topic.title.trim() &&
        topic.purpose.trim() &&
        topic.durationMinutes >= 5 &&
        topic.outcomes.some((outcome) => outcome.trim()),
    );
  return (
    <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
      <section className="rounded-[22px] border border-border bg-card shadow-[0_16px_50px_rgba(39,70,54,0.07)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-5 sm:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.12em] text-primary">
              Course structure
            </p>
            <input
              aria-label="Course title"
              className="mt-1 w-full bg-transparent text-lg font-semibold outline-none"
              value={plan.title}
              onChange={(event) =>
                setPlan((current) =>
                  current ? { ...current, title: event.target.value } : current,
                )
              }
            />
          </div>
          <Badge className="bg-[#ececea] text-primary">
            {plan.topics.length} topics · {totalMinutes} minutes
          </Badge>
        </div>
        <div className="space-y-4 p-6 sm:p-8">
          {plan.topics.map((topic, index) => (
            <article
              key={index}
              className="rounded-xl border border-border bg-white p-4"
            >
              <div className="flex items-start gap-3">
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-secondary text-xs font-semibold text-primary">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1 space-y-3">
                  <input
                    aria-label={`Topic ${index + 1} title`}
                    className="field-control font-semibold"
                    value={topic.title}
                    onChange={(event) =>
                      updateTopic(index, { title: event.target.value })
                    }
                  />
                  <textarea
                    aria-label={`Topic ${index + 1} purpose`}
                    className="field-control min-h-20 resize-y py-3"
                    value={topic.purpose}
                    onChange={(event) =>
                      updateTopic(index, { purpose: event.target.value })
                    }
                  />
                  <div className="grid gap-3 sm:grid-cols-[140px_1fr]">
                    <div>
                      <label
                        className="field-label"
                        htmlFor={`topic-duration-${index}`}
                      >
                        Minutes
                      </label>
                      <input
                        id={`topic-duration-${index}`}
                        type="number"
                        min="5"
                        step="5"
                        className="field-control mt-2"
                        value={topic.durationMinutes}
                        onChange={(event) =>
                          updateTopic(index, {
                            durationMinutes: Math.max(
                              5,
                              Number(event.target.value) || 5,
                            ),
                          })
                        }
                      />
                    </div>
                    <div>
                      <label
                        className="field-label"
                        htmlFor={`topic-outcomes-${index}`}
                      >
                        Learning outcomes
                      </label>
                      <textarea
                        id={`topic-outcomes-${index}`}
                        className="field-control mt-2 min-h-24 resize-y py-3"
                        value={topic.outcomes.join('\n')}
                        onChange={(event) =>
                          updateTopic(index, {
                            outcomes: event.target.value.split('\n'),
                          })
                        }
                      />
                      <p className="field-help">
                        Enter one measurable outcome per line.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col gap-1">
                  <button
                    type="button"
                    aria-label={`Move topic ${index + 1} up`}
                    disabled={index === 0}
                    onClick={() => moveTopic(index, -1)}
                    className="rounded-md p-2 text-muted-foreground hover:bg-muted disabled:opacity-30"
                  >
                    <ChevronUp className="size-4" />
                  </button>
                  <button
                    type="button"
                    aria-label={`Move topic ${index + 1} down`}
                    disabled={index === plan.topics.length - 1}
                    onClick={() => moveTopic(index, 1)}
                    className="rounded-md p-2 text-muted-foreground hover:bg-muted disabled:opacity-30"
                  >
                    <ChevronDown className="size-4" />
                  </button>
                  <button
                    type="button"
                    aria-label={`Remove topic ${index + 1}`}
                    disabled={plan.topics.length <= 2}
                    onClick={() => removeTopic(index)}
                    className="rounded-md p-2 text-muted-foreground hover:bg-red-50 hover:text-red-700 disabled:opacity-30"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            </article>
          ))}
          <Button variant="outline" className="w-full" onClick={addTopic}>
            <Plus /> Add topic
          </Button>
          {error && (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-800"
            >
              {error}
            </div>
          )}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
            <Button variant="ghost" onClick={onBack}>
              <ArrowLeft /> Back to brief review
            </Button>
            <Button
              className="h-11 gap-2 px-5"
              onClick={onApprove}
              disabled={generating || !valid}
            >
              {generating ? (
                <>
                  <span className="size-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />{' '}
                  {generationProgress||'Developing topic materials…'}
                </>
              ) : (
                <>
                  <WandSparkles /> {completedTopicCount>=plan.topics.length?'Assemble saved topics':completedTopicCount?`Resume from topic ${completedTopicCount+1}`:'Approve structure and develop material'}
                </>
              )}
            </Button>
          </div>
        </div>
      </section>
      <aside className="space-y-4">
        <div className="rounded-[20px] border border-border bg-card p-5">
          <h3 className="text-sm font-semibold">Before approval</h3>
          <div className="mt-4 space-y-3 text-xs leading-5 text-muted-foreground">
            <p>
              Check that the topics are complete, ordered correctly and fit the
              available training time.
            </p>
            <p>
              You can edit titles, timing and outcomes, reorder topics or add
              and remove topics.
            </p>
            {completedTopicCount>0&&<p className="font-medium text-primary">{completedTopicCount} of {plan.topics.length} topics are saved. Retrying resumes from the next topic.</p>}
          </div>
        </div>
        {usage && (
          <div className="rounded-[20px] border border-border bg-card p-5">
            <h3 className="text-sm font-semibold">Structure planning</h3>
            <dl className="mt-3 space-y-2 text-xs">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Tokens used</dt>
                <dd className="font-medium">
                  {usage.totalTokens.toLocaleString()}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">DocBeans credits</dt>
                <dd className="font-medium">{usage.credits}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Topic output allowance</dt>
                <dd className="text-right font-medium">Up to {maximumOutputTokens.toLocaleString()} tokens</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Maximum output cost</dt>
                <dd className="font-medium">US${maximumOutputCost.toFixed(4)}</dd>
              </div>
            </dl>
            {notice && (
              <p className="mt-3 text-xs leading-5 text-muted-foreground">
                {notice}
              </p>
            )}
          </div>
        )}
        <div className="rounded-[20px] bg-[#161616] p-5 text-white">
          <ShieldCheck className="size-4 text-[#d6d6d2]" />
          <h3 className="mt-3 text-sm font-semibold">
            Approval controls scope
          </h3>
          <p className="mt-2 text-xs leading-5 text-white/70">
            Only the approved topics are sent for full material development.
            Exercises remain a separate step after the material is approved.
          </p>
        </div>
      </aside>
    </div>
  );
}

function ReviewScreen({
  documentType,
  purpose,
  audience,
  outcome,
  tone,
  visuals,
  trainingExerciseTypes,
  trainingDuration,
  presentationSlideCount,
  proposalDetails,
  groundingMode,
  requirements,
  sources,
  knowledgeNotes,
  font,
  theme,
  exportFormat,
  maxOutputTokens,
  setMaxOutputTokens,
  recommendedOutputTokens,
  recommendedExerciseTokens,
  documentTemplate,
  templateMode,
  aiSettings,
  onSelectAiAccess,
  generating,
  error,
  failedUsage,
  notice,
  onBack,
  onGenerate,
}: {
  documentType: AdvancedDocumentType;
  purpose: string;
  audience: string;
  outcome: string;
  tone: string;
  visuals: VisualPreference;
  trainingExerciseTypes: TrainingExerciseType[];
  trainingDuration: string;
  presentationSlideCount: number;
  proposalDetails: ProposalDetails;
  groundingMode: GroundingMode;
  requirements: Requirement[];
  sources: Source[];
  knowledgeNotes: string;
  font: DocumentFont;
  theme: DocumentTheme;
  exportFormat: ExportFormat;
  maxOutputTokens: number;
  setMaxOutputTokens: (v: number) => void;
  recommendedOutputTokens: number;
  recommendedExerciseTokens: number;
  documentTemplate: DocumentTemplateProfile | null;
  templateMode: TemplateApplicationMode;
  aiSettings: AiSettings;
  onSelectAiAccess: (mode: 'managed' | 'byok') => void;
  generating: boolean;
  error: string;
  failedUsage: GenerationUsage | null;
  notice: string;
  onBack: () => void;
  onGenerate: () => void;
}) {
  const proposalMode = isProposalBrief(documentType, purpose, outcome);
  const missingProposalDetails = proposalMode
    ? requiredProposalDetailKeys.filter((key) => !proposalDetails[key].trim())
    : [];
  const readySources = sources.filter((source) => source.status === 'Ready');
  const knowledgeSummary = `${readySources.length} approved source${readySources.length === 1 ? '' : 's'}${knowledgeNotes.trim() ? ' + pasted notes' : ''}`;
  const templateSummary = documentTemplate
    ? `${documentTemplate.name} · ${templateMode === 'both' ? 'content + design' : templateMode}`
    : 'No template';
  const rows = [
    ['Document', advancedDocumentLabels[documentType]],
    ...(documentType === 'presentation'
      ? [['Slides', `${presentationSlideCount} total, including title slide`]]
      : []),
    ...(documentType === 'training-material'
      ? [
          [
            'Exercise formats',
            trainingExerciseTypes
              .map((item) => trainingExerciseLabels[item])
              .join(', '),
          ],
          ['Training duration', trainingDuration],
        ]
      : []),
    ...(proposalMode
      ? [
          ['Proposal need', proposalDetails.clientNeed],
          ['Proposed solution', proposalDetails.proposedSolution],
          ['Scope', proposalDetails.scopeDeliverables],
          ['Measurable value', proposalDetails.measurableValue],
          ['Delivery', proposalDetails.deliveryPlan],
          ['Risks and assumptions', proposalDetails.risksAssumptions],
          ['Decision requested', proposalDetails.decisionNextStep],
          ...(proposalDetails.commercialTerms.trim()
            ? [['Commercials', proposalDetails.commercialTerms]]
            : []),
        ]
      : []),
    ['Content goal', purpose],
    ['Audience', audience],
    ['Tone', tone],
    ['Visuals', visuals === 'yes' ? 'Create supporting visuals' : 'Text only'],
    ['Knowledge', knowledgeSummary],
    ['Template', templateSummary],
    ['Download', exportFormat.toUpperCase()],
    [
      documentType === 'training-material'
        ? 'Per-topic output allowance'
        : 'AI output budget',
      `${maxOutputTokens.toLocaleString()} tokens maximum`,
    ],
    [
      'Design',
      documentTemplate && templateMode !== 'structure'
        ? `${documentTemplate.design.fontFamily} · template palette`
        : `${documentThemes[theme].label} · ${documentFonts[font].label.split(' · ')[0]}`,
    ],
    ['Desired response', outcome || 'No specific action requested'],
    [
      'Grounding',
      groundingMode === 'approved-only'
        ? 'Approved sources only'
        : 'Approved sources + external websites',
    ],
  ];
  const hasByok = Boolean(aiSettings.apiKey.trim());
  const model =
    llmModels[aiSettings.provider].find(
      (item) => item.value === aiSettings.model,
    ) || llmModels[aiSettings.provider][0];
  const sourceCharacterEstimate = readySources.reduce(
    (total, source) =>
      total +
      (source.kind === 'image'
        ? 0
        : Math.min(10_000, Math.max(1, source.chunkCount || 1) * 2_500)),
    0,
  );
  const briefCharacterEstimate = [
    purpose,
    audience,
    outcome,
    tone,
    ...Object.values(proposalDetails),
    knowledgeNotes,
    ...requirements.map((item) => item.text),
    ...(documentTemplate?.structure.headings || []),
  ].join(' ').length;
  const singlePassInputTokens = Math.max(
    500,
    Math.ceil((briefCharacterEstimate + sourceCharacterEstimate) / 4),
  );
  const durationMatch = trainingDuration.match(
    /^([\d.]+)\s+(minutes|hours|days)$/i,
  );
  const durationAmount = Number(durationMatch?.[1] || 0);
  const durationHours =
    durationMatch?.[2]?.toLowerCase() === 'minutes'
      ? durationAmount / 60
      : durationMatch?.[2]?.toLowerCase() === 'days'
        ? durationAmount * 6
        : durationAmount;
  const estimatedTopicCount =
    documentType === 'training-material'
      ? Math.max(2, Math.min(10, Math.ceil(durationHours / 0.75)))
      : 1;
  const estimatedInputTokens =
    documentType === 'training-material'
      ? singlePassInputTokens
      : singlePassInputTokens;
  const estimatedOutputTokens =
    documentType === 'training-material'
      ? 6000
      : maxOutputTokens * estimatedTopicCount;
  const estimatedProviderCost =
    (estimatedInputTokens * model.inputUsdPerMillion +
      estimatedOutputTokens * model.outputUsdPerMillion) /
    1_000_000;
  return (
    <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
      <section className="rounded-[22px] border border-border bg-card shadow-[0_16px_50px_rgba(39,70,54,0.07)]">
        <div className="flex items-center justify-between border-b border-border px-6 py-5 sm:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.12em] text-primary">
              Interpreted brief
            </p>
            <h2 className="mt-1 text-lg font-semibold">
              Ready for your confirmation
            </h2>
          </div>
          <Badge className="bg-[#ececea] text-primary">
            <CheckCircle2 /> Complete
          </Badge>
        </div>
        <div className="p-6 sm:p-8">
          <div className="grid gap-x-8 gap-y-5 md:grid-cols-2">
            {rows.map(([label, value]) => (
              <div key={label}>
                <p className="text-[11px] font-semibold uppercase tracking-[.1em] text-muted-foreground">
                  {label}
                </p>
                <p className="mt-1.5 text-sm leading-5">{value}</p>
              </div>
            ))}
          </div>
          <div className="mt-7 border-t border-border pt-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Content requirements</h3>
              <span className="text-xs text-primary">
                {requirements.length} of {requirements.length} valid
              </span>
            </div>
            <div className="mt-3 space-y-2">
              {requirements.map((req) => (
                <div
                  key={req.id}
                  className="flex gap-2 rounded-lg bg-muted/55 px-3 py-2.5 text-sm"
                >
                  <Check className="mt-0.5 size-3.5 shrink-0 text-primary" />
                  <span>{req.text}</span>
                </div>
              ))}
            </div>
          </div>
          {proposalMode && (
            <div
              className={`mt-6 rounded-xl border px-4 py-3 ${missingProposalDetails.length ? 'border-amber-300 bg-amber-50 text-amber-950' : 'border-emerald-200 bg-emerald-50 text-emerald-950'}`}
            >
              <p className="text-sm font-semibold">
                Proposal readiness:{' '}
                {missingProposalDetails.length ? 'Incomplete' : 'Ready'}
              </p>
              <p className="mt-1 text-xs leading-5">
                {missingProposalDetails.length
                  ? `Complete these items before generation: ${missingProposalDetails.map((key) => proposalDetailLabels[key]).join(', ')}.`
                  : 'Need, solution, scope, value, delivery, risks and the requested decision are explicitly defined.'}
              </p>
            </div>
          )}
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <ReviewStat
              icon={FileText}
              value={`${readySources.length + (knowledgeNotes.trim() ? 1 : 0)}`}
              label="Knowledge inputs"
            />
            <ReviewStat icon={ClipboardCheck} value="0" label="Conflicts" />
            <ReviewStat icon={ShieldCheck} value="Pass" label="Policy check" />
          </div>
          <fieldset className="mt-6 rounded-xl border border-border p-4">
            <legend className="px-1 text-sm font-semibold">
              AI generation access
            </legend>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Choose how this document will access{' '}
              {aiSettings.provider === 'anthropic' ? 'Anthropic' : 'OpenAI'} ·{' '}
              {aiSettings.model}.
            </p>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              <button
                type="button"
                onClick={() => onSelectAiAccess('managed')}
                className={`rounded-xl border p-3 text-left text-sm transition ${aiSettings.credentialMode === 'managed' ? 'border-primary bg-secondary ring-1 ring-primary/15' : 'border-border bg-white hover:border-primary/40'}`}
              >
                <span className="font-semibold">Use DocBeans AI</span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  DocBeans-managed access and billing
                </span>
              </button>
              <button
                type="button"
                disabled={!hasByok}
                onClick={() => onSelectAiAccess('byok')}
                className={`rounded-xl border p-3 text-left text-sm transition disabled:cursor-not-allowed disabled:opacity-50 ${aiSettings.credentialMode === 'byok' && hasByok ? 'border-primary bg-secondary ring-1 ring-primary/15' : 'border-border bg-white hover:border-primary/40'}`}
              >
                <span className="font-semibold">Use existing BYOK</span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  {hasByok
                    ? 'Key available in this tab'
                    : 'No saved key in this tab'}
                </span>
              </button>
              <a
                href="/settings?returnTo=%2Fcreate"
                className="rounded-xl border border-border bg-white p-3 text-left text-sm transition hover:border-primary/40"
              >
                <span className="font-semibold">
                  {hasByok ? 'Update BYOK' : 'Add new BYOK'}
                </span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  Open secure AI settings
                </span>
              </a>
            </div>
            <div className="mt-4 rounded-xl bg-muted/60 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <label
                  htmlFor="review-output-budget"
                  className="text-xs font-semibold"
                >
                  {documentType === 'training-material'
                    ? 'Per-topic output allowance'
                    : 'Customer output-token limit'}
                </label>
                <span className="text-sm font-semibold">
                  Up to US${estimatedProviderCost.toFixed(4)}
                </span>
              </div>
              <div className="mt-3 grid items-center gap-3 sm:grid-cols-[1fr_126px]">
                <input
                  id="review-output-budget"
                  type="range"
                  min="4000"
                  max="24000"
                  step="1000"
                  value={maxOutputTokens}
                  onChange={(e) => setMaxOutputTokens(Number(e.target.value))}
                  disabled={generating}
                />
                <input
                  aria-label="Customer output-token limit"
                  type="number"
                  min="4000"
                  max="24000"
                  step="1000"
                  className="field-control text-right"
                  value={maxOutputTokens}
                  onChange={(e) =>
                    setMaxOutputTokens(
                      clampOutputTokens(Number(e.target.value) || 4000),
                    )
                  }
                  disabled={generating}
                />
              </div>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs leading-5 text-muted-foreground">
                  {documentType === 'training-material'
                    ? `Structure planning: approximately ${estimatedInputTokens.toLocaleString()} input + up to 6,000 output tokens. The approved topic count determines the full development estimate.`
                    : `Approximately ${estimatedInputTokens.toLocaleString()} input + up to ${estimatedOutputTokens.toLocaleString()} estimated output tokens.`}
                </p>
                <button
                  type="button"
                  className="text-xs font-semibold text-primary underline underline-offset-4"
                  onClick={() => setMaxOutputTokens(recommendedOutputTokens)}
                  disabled={generating}
                >
                  Use recommended {recommendedOutputTokens.toLocaleString()}
                </button>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {documentType === 'training-material'
                  ? `This first request creates only the editable course structure. After you approve it, each topic receives a ${recommendedOutputTokens.toLocaleString()}-token maximum and its own validated PowerPoint. Exercises use a separate ${recommendedExerciseTokens.toLocaleString()}-token maximum after material approval.`
                  : 'The estimate updates immediately. Actual cost depends on provider-reported usage.'}
              </p>
              <p className="mt-2 text-xs font-medium">
                {aiSettings.credentialMode === 'byok'
                  ? 'Your provider account is billed; DocBeans AI charge: SGD 0.00.'
                  : documentType === 'training-material'
                    ? 'Structure planning consumes no DocBeans credit or managed-AI charge; provider token cost still applies.'
                    : 'On successful generation: 1 DocBeans credit and SGD 0.03 managed-AI charge.'}
              </p>
            </div>
          </fieldset>
          <InfoBox
            icon={Sparkles}
            title="Development approach"
            className="mt-6"
          >
            {documentType === 'training-material'
              ? 'DocBeans first creates a concise course structure for your approval. Full topic materials are developed only after you confirm or edit that structure.'
              : 'DocBeans ranks locally indexed chunks against this brief, sends a bounded set of relevant excerpts to your selected AI provider, validates the returned structure and only then unlocks review and download.'}
          </InfoBox>
          {error && (
            <div
              role="alert"
              className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-800"
            >
              <p>{error}</p>
              {failedUsage && (
                <p className="mt-2 text-xs">
                  Attempt usage: {failedUsage.inputTokens.toLocaleString()}{' '}
                  input + {failedUsage.outputTokens.toLocaleString()} output
                  tokens · estimated provider cost US$
                  {failedUsage.providerCostUsd.toFixed(6)} · 0 DocBeans credits
                  · SGD 0.00 DocBeans charge.
                </p>
              )}
              {notice && <p className="mt-1 text-xs">{notice}</p>}
              {error.includes('AI settings') && (
                <a
                  href="/settings?returnTo=%2Fcreate"
                  className="mt-2 inline-flex font-semibold underline underline-offset-4"
                >
                  Open AI settings without losing this brief
                </a>
              )}
            </div>
          )}
          <div className="mt-7 flex items-center justify-between border-t border-border pt-5">
            <Button variant="ghost" onClick={onBack}>
              <ArrowLeft /> Edit brief
            </Button>
            <Button
              className="h-11 gap-2 px-5"
              onClick={onGenerate}
              disabled={generating || missingProposalDetails.length > 0}
            >
              {generating ? (
                <>
                  <span className="size-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />{' '}
                  {documentType === 'training-material'
                    ? 'Developing course structure…'
                    : 'Selecting evidence and developing…'}
                </>
              ) : (
                <>
                  <WandSparkles />{' '}
                  {documentType === 'training-material'
                    ? 'Develop course structure'
                    : 'Develop document'}
                </>
              )}
            </Button>
          </div>
        </div>
      </section>
      <aside className="space-y-4">
        <div className="rounded-[20px] border border-border bg-card p-5">
          <h3 className="text-sm font-semibold">Pre-generation checks</h3>
          <div className="mt-4 space-y-3">
            {[
              'Four-step brief complete',
              'Knowledge content indexed',
              'Relevant excerpts selected',
              'AI provider selected',
              'Structured response required',
              'Placeholder content blocked',
            ].map((item) => (
              <div key={item} className="flex items-center gap-2.5 text-xs">
                <span className="grid size-5 place-items-center rounded-full bg-[#ececea] text-primary">
                  <Check className="size-3" />
                </span>
                {item}
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-[20px] bg-[#161616] p-5 text-white">
          <Sparkles className="size-5 text-[#d6d6d2]" />
          <h3 className="mt-3 text-sm font-semibold">What happens next</h3>
          <p className="mt-2 text-xs leading-5 text-white/70">
            {documentType === 'training-material'
              ? 'DocBeans creates the topic sequence, timing and learning outcomes first. You can edit and approve them before any full topic material is generated.'
              : 'DocBeans develops substantive content and editable visuals, validates the result, then holds it for your review. A failed or placeholder response cannot be downloaded.'}
          </p>
        </div>
      </aside>
    </div>
  );
}

function DraftScreen({
  documentType,
  document,
  audience,
  tone,
  visuals,
  groundingMode,
  exportFormat,
  font,
  theme,
  colours,
  requirements,
  sources,
  documentTemplate,
  templateMode,
  usage,
  notice,
  trainingExerciseTypes,
  recommendedExerciseTokens,
  exerciseGenerating,
  exerciseError,
  exerciseUsage,
  onGenerateExercises,
  onEditBrief,
}: {
  documentType: AdvancedDocumentType;
  document: AdvancedDocument;
  audience: string;
  tone: string;
  visuals: VisualPreference;
  groundingMode: GroundingMode;
  exportFormat: ExportFormat;
  font: DocumentFont;
  theme: DocumentTheme;
  colours: DocumentColours;
  requirements: Requirement[];
  sources: Source[];
  documentTemplate: DocumentTemplateProfile | null;
  templateMode: TemplateApplicationMode;
  usage: GenerationUsage | null;
  notice: string;
  trainingExerciseTypes: TrainingExerciseType[];
  recommendedExerciseTokens: number;
  exerciseGenerating: boolean;
  exerciseError: string;
  exerciseUsage: GenerationUsage | null;
  onGenerateExercises: () => void;
  onEditBrief: () => void;
}) {
  const [tab, setTab] = useState<
    'document' | 'topics' | 'coverage' | 'sources'
  >('document');
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');
  const preset = documentThemes[theme];
  const templateDesign =
    documentTemplate && templateMode !== 'structure'
      ? documentTemplate.design
      : null;
  const effectiveColours: DocumentColours = templateDesign
    ? {
        heading: templateDesign.headingColor,
        subheading:
          templateDesign.accentColors[0] || templateDesign.headingColor,
        body: templateDesign.bodyColor,
      }
    : colours;
  const effectivePreset = {
    ...preset,
    surface: templateDesign?.backgroundColor || preset.surface,
    accent: effectiveColours.heading,
    text: effectiveColours.body,
    border: templateDesign?.accentColors[1] || preset.border,
  };
  const effectiveFontFamily =
    templateDesign?.fontFamily || documentFonts[font].exportFamily;
  const effectivePdfFont=pdfFontFromFamily(effectiveFontFamily);
  const title = document.title;
  const visibleSubtitle=documentType==='training-material'?professionalTrainingSubtitle(document.subtitle):document.subtitle;
  const approvedReferences = new Set(
    sources.flatMap((source) =>
      [source.name, source.url].filter((value): value is string =>
        Boolean(value),
      ),
    ),
  );
  const externalReferences = document.sourcesUsed.filter(
    (reference) =>
      /^https?:\/\//i.test(reference) && !approvedReferences.has(reference),
  );
  const baseName =
    advancedDocumentLabels[documentType]
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-') || 'docbeans-document';
  const sectionText = (section: AdvancedSection) =>
    [
      section.title,
      section.summary,
      ...section.bullets.map((item) => `• ${item}`),
    ].join('\n');
  const text = [
    title,
    visibleSubtitle,
    `For ${audience}`,
    `Tone: ${tone}`,
    '',
    ...document.sections.flatMap((section) => [sectionText(section), '']),
    document.sourcesUsed.length ? 'Sources used:' : '',
    ...document.sourcesUsed,
  ]
    .filter(Boolean)
    .join('\n')
    .trim();
  const hasExercises = document.sections.some((section) =>
    /\b(?:mcq|multiple.choice|mini.project|role.play|answer.key|assessment.rubric)\b/i.test(
      `${section.title} ${section.summary}`,
    ),
  );
  const draftTabs: (typeof tab)[] = document.trainingModules?.length
    ? ['document', 'topics', 'coverage', 'sources']
    : ['document', 'coverage', 'sources'];

  const saveBlob = (blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob);
    const link = globalThis.document.createElement('a');
    link.href = url;
    link.download = fileName;
    globalThis.document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const downloadAdvancedDocument = async () => {
    setExporting(true);
    setExportError('');
    try {
      if (exportFormat === 'txt')
        saveBlob(
          new Blob([text], { type: 'text/plain;charset=utf-8' }),
          `${baseName}.txt`,
        );
      else if (exportFormat === 'pdf') {
        const { jsPDF } = await import('jspdf');
        const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
        const width = pdf.internal.pageSize.getWidth();
        const height = pdf.internal.pageSize.getHeight();
        const margin = 54;
        pdf.setFont(effectivePdfFont, 'bold');
        pdf.setFontSize(20);
        pdf.setTextColor(effectiveColours.heading);
        pdf.text(advancedDocumentLabels[documentType], margin, 64);
        pdf.setFont(effectivePdfFont, 'normal');
        pdf.setFontSize(11);
        pdf.setTextColor(effectiveColours.body);
        let y = 94;
        for (const line of pdf.splitTextToSize(
          text,
          width - margin * 2,
        ) as string[]) {
          if (y > height - margin) {
            pdf.addPage();
            y = margin;
          }
          pdf.text(line, margin, y);
          y += 16;
        }
        pdf.save(`${baseName}.pdf`);
      } else if (exportFormat === 'docx') {
        const { Document, HeadingLevel, Packer, Paragraph, TextRun } =
          await import('docx');
        const headingHex = effectiveColours.heading.replace('#', ''),
          bodyHex = effectiveColours.body.replace('#', '');
        const children = [
          new Paragraph({
            heading: HeadingLevel.TITLE,
            children: [
              new TextRun({
                text: title,
                bold: true,
                size: 56,
                font: effectiveFontFamily,
                color: headingHex,
              }),
            ],
          }),
          new Paragraph({
            heading: HeadingLevel.SUBTITLE,
            children: [
              new TextRun({
                text: document.subtitle,
                size: 28,
                font: effectiveFontFamily,
                color: bodyHex,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `For ${audience} · ${tone}`,
                italics: true,
                font: effectiveFontFamily,
                color: bodyHex,
              }),
            ],
          }),
          ...document.sections.flatMap((section) => [
            new Paragraph({
              heading: HeadingLevel.HEADING_1,
              children: [
                new TextRun({
                  text: section.title,
                  bold: true,
                  size: 34,
                  font: effectiveFontFamily,
                  color: headingHex,
                }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: section.summary,
                  font: effectiveFontFamily,
                  color: bodyHex,
                }),
              ],
            }),
            ...section.bullets.map(
              (item) =>
                new Paragraph({
                  bullet: { level: 0 },
                  children: [
                    new TextRun({
                      text: item,
                      font: effectiveFontFamily,
                      color: bodyHex,
                    }),
                  ],
                }),
            ),
          ]),
          ...(document.sourcesUsed.length
            ? [
                new Paragraph({
                  heading: HeadingLevel.HEADING_1,
                  children: [
                    new TextRun({
                      text: 'Sources used',
                      bold: true,
                      size: 34,
                      font: effectiveFontFamily,
                      color: headingHex,
                    }),
                  ],
                }),
                ...document.sourcesUsed.map(
                  (name) =>
                    new Paragraph({
                      bullet: { level: 0 },
                      children: [
                        new TextRun({
                          text: name,
                          font: effectiveFontFamily,
                          color: bodyHex,
                        }),
                      ],
                    }),
                ),
              ]
            : []),
        ];
        saveBlob(
          await Packer.toBlob(
            new Document({ sections: [{ properties: {}, children }] }),
          ),
          `${baseName}.docx`,
        );
      } else if (exportFormat === 'pptx') {
        const PptxGenJS = (await import('pptxgenjs')).default;
        const deck = new PptxGenJS();
        const fontFace=effectiveFontFamily;
        const heading = effectiveColours.heading.replace('#', ''),
          body = effectiveColours.body.replace('#', ''),
          subheading = effectiveColours.subheading.replace('#', ''),
          border = effectivePreset.border.replace('#', ''),
          surface = effectivePreset.surface.replace('#', '');
        deck.layout =
          documentTemplate?.format === 'pptx' &&
          documentTemplate.design.aspectRatio === 'Standard 4:3'
            ? 'LAYOUT_4X3'
            : 'LAYOUT_WIDE';
        deck.author = 'DocBeans';
        deck.company = 'Petreltech';
        deck.title = title;
        deck.subject = advancedDocumentLabels[documentType];
        const opening = deck.addSlide();
        opening.background = { color: surface };
        opening.addShape(deck.ShapeType.rect, {
          x: 0,
          y: 0,
          w: 0.18,
          h: 7.5,
          fill: { color: heading },
          line: { color: heading },
        });
        opening.addText(title, {
          x: 0.92,
          y: 1.65,
          w: 11.2,
          h: 1.35,
          fontFace,
          fontSize: 42,
          bold: true,
          color: heading,
          margin: 0,
          breakLine: false,
          fit: 'shrink',
        });
        opening.addText(visibleSubtitle, {
          x: 0.94,
          y: 3.18,
          w: 10.6,
          h: 0.8,
          fontFace,
          fontSize: 22,
          color: body,
          margin: 0,
          fit: 'shrink',
        });
        opening.addText(`Prepared for ${audience}`, {
          x: 0.94,
          y: 4.3,
          w: 7,
          h: 0.36,
          fontFace,
          fontSize: 13,
          color: subheading,
          margin: 0,
        });
        opening.addNotes(
          `Generated by DocBeans. Sources: ${document.sourcesUsed.join('; ') || 'Supplied brief'}`,
        );
        for (const [index, section] of document.sections.entries()) {
          const slide = deck.addSlide();
          const hasVisual = visuals === 'yes' && section.visual.type !== 'none';
          const textWidth = hasVisual ? 5.5 : 11.45;
          slide.background = { color: surface };
          slide.addText(section.title, {
            x: 0.75,
            y: 0.38,
            w: 11.85,
            h: 0.72,
            fontFace,
            fontSize: 32,
            bold: true,
            color: heading,
            margin: 0,
            fit: 'shrink',
          });
          slide.addShape(deck.ShapeType.line, {
            x: 0.75,
            y: 1.18,
            w: 11.85,
            h: 0,
            line: { color: border, width: 1 },
          });
          slide.addText(section.summary, {
            x: 0.82,
            y: 1.5,
            w: textWidth,
            h: 0.92,
            fontFace,
            fontSize: 19,
            bold: true,
            color: body,
            margin: 0,
            fit: 'shrink',
          });
          const qna = /\bQ(?:uestion)?\s*[:.-].+\bA(?:nswer)?\s*[:.-]/i;
          if (section.bullets.length) {
            if (section.bullets.every((item) => qna.test(item))) {
              section.bullets.slice(0, 2).forEach((item, itemIndex) => {
                const match = item.match(
                  /^(?:Q(?:uestion)?\s*[:.-]\s*)?(.+?)\s+A(?:nswer)?\s*[:.-]\s*(.+)$/i,
                );
                const y = 2.68 + itemIndex * 1.55;
                slide.addText(match?.[1] || item, {
                  x: 0.9,
                  y,
                  w: textWidth - 0.15,
                  h: 0.46,
                  fontFace,
                  fontSize: 18,
                  bold: true,
                  color: heading,
                  margin: 0,
                  fit: 'shrink',
                });
                slide.addText(match?.[2] || '', {
                  x: 0.9,
                  y: y + 0.53,
                  w: textWidth - 0.15,
                  h: 0.68,
                  fontFace,
                  fontSize: 16.5,
                  color: body,
                  margin: 0,
                  fit: 'shrink',
                });
              });
            } else
              slide.addText(
                section.bullets.map((item) => ({
                  text: item,
                  options: {
                    bullet: { indent: 20 },
                    hanging: 5,
                    breakLine: true,
                  },
                })),
                {
                  x: 0.86,
                  y: 2.62,
                  w: textWidth,
                  h: 3.75,
                  fontFace,
                  fontSize: 18,
                  color: body,
                  margin: 0.04,
                  paraSpaceAfter: 12,
                  valign: 'top',
                  fit: 'shrink',
                },
              );
          }
          if (hasVisual) {
            const visual = section.visual,
              x = 6.9,
              y = 1.55,
              w = 5.62;
            slide.addText(visual.title || section.title, {
              x,
              y,
              w,
              h: 0.42,
              fontFace,
              fontSize: 16,
              bold: true,
              color: subheading,
              margin: 0,
              fit: 'shrink',
            });
            slide.addShape(deck.ShapeType.line, {
              x,
              y: y + 0.53,
              w,
              h: 0,
              line: { color: border, width: 1 },
            });
            if (
              visual.type === 'chart' &&
              visual.labels.length === visual.values.length &&
              visual.labels.length > 1
            )
              slide.addChart(
                deck.ChartType.bar,
                [
                  {
                    name: visual.title || 'Source data',
                    labels: visual.labels,
                    values: visual.values,
                  },
                ],
                {
                  x,
                  y: y + 0.78,
                  w,
                  h: 3.5,
                  showLegend: false,
                  showTitle: false,
                  showValue: true,
                  catAxisLabelFontFace: fontFace,
                  catAxisLabelFontSize: 11,
                  valAxisLabelFontFace: fontFace,
                  valAxisLabelFontSize: 10,
                  chartColors: [heading],
                  showValAxisTitle: false,
                  showCatAxisTitle: false,
                  showBorder: false,
                },
              );
            else if (
              visual.type === 'source-image' &&
              sources.find(
                (source) =>
                  source.kind === 'image' &&
                  source.name === visual.sourceName &&
                  source.dataUrl,
              )
            )
              slide.addImage({
                data: sources.find(
                  (source) =>
                    source.kind === 'image' &&
                    source.name === visual.sourceName &&
                    source.dataUrl,
                )!.dataUrl!,
                x,
                y: y + 0.76,
                w,
                h: 3.55,
              });
            else {
              const labels = visual.labels.length
                ? visual.labels.slice(0, 6)
                : visual.description
                    .split(/[,;]|\bthen\b/i)
                    .map((item) => item.trim())
                    .filter(Boolean)
                    .slice(0, 6);
              if (['process', 'timeline'].includes(visual.type)) {
                const count = Math.max(1, labels.length), gap = 0.12, cellW = (w - gap * (count - 1)) / count;
                labels.forEach((label, itemIndex) => {
                  const cellX = x + itemIndex * (cellW + gap);
                  if (itemIndex < count - 1)
                    slide.addShape(deck.ShapeType.line, { x: cellX + cellW * 0.72, y: y + 1.22, w: cellW * 0.56 + gap, h: 0, line: { color: heading, transparency: 35, width: 1.5 } });
                  slide.addShape(deck.ShapeType.ellipse, { x: cellX + cellW / 2 - 0.23, y: y + 0.98, w: 0.46, h: 0.46, fill: { color: heading }, line: { color: heading } });
                  slide.addText(String(itemIndex + 1), { x: cellX + cellW / 2 - 0.23, y: y + 1.12, w: 0.46, h: 0.14, fontFace, fontSize: 9, bold: true, color: 'FFFFFF', align: 'center', margin: 0 });
                  slide.addText(label, { x: cellX + 0.02, y: y + 1.62, w: cellW - 0.04, h: 1.15, fontFace, fontSize: 11.5, bold: true, color: body, align: 'center', valign: 'top', margin: 0.03, fit: 'shrink' });
                });
              } else if (visual.type === 'architecture') {
                const boxH = Math.min(0.62, 3.15 / Math.max(1, labels.length));
                labels.forEach((label, itemIndex) => {
                  const boxY = y + 0.78 + itemIndex * (boxH + 0.13);
                  slide.addShape(deck.ShapeType.roundRect, { x, y: boxY, w, h: boxH, rectRadius: 0.05, fill: { color: itemIndex % 2 ? 'FFFFFF' : heading, transparency: itemIndex % 2 ? 0 : 88 }, line: { color: heading, transparency: 55, width: 1 } });
                  slide.addText(label, {
                    x: x + 0.16,
                    y: boxY,
                    w: w - 0.32,
                    h: boxH,
                    fontFace,
                    fontSize: 12.5,
                    bold: true,
                    color: body,
                    align: 'center',
                    valign: 'middle',
                    margin: 0,
                    fit: 'shrink',
                  });
                });
              } else if (visual.type === 'cycle') {
                const positions = [
                  [x + 1.45, y + 0.78],
                  [x + 2.72, y + 1.92],
                  [x + 1.45, y + 3.05],
                  [x + 0.18, y + 1.92],
                ];
                labels.slice(0, 4).forEach((label, itemIndex) => {
                  const [cellX, cellY] = positions[itemIndex];
                  slide.addShape(deck.ShapeType.ellipse, {
                    x: cellX,
                    y: cellY,
                    w: 1.18,
                    h: 0.82,
                    fill: { color: itemIndex % 2 ? 'FFFFFF' : heading, transparency: itemIndex % 2 ? 0 : 4 },
                    line: { color: heading, width: 1.5 },
                  });
                  slide.addText(label, {
                    x: cellX + 0.08,
                    y: cellY + 0.12,
                    w: 1.02,
                    h: 0.55,
                    fontFace,
                    fontSize: 11.5,
                    bold: true,
                    color: itemIndex % 2 ? body : 'FFFFFF',
                    align: 'center',
                    valign: 'middle',
                    margin: 0,
                    fit: 'shrink',
                  });
                });
              } else {
                const rows = Math.ceil(labels.length / 2),
                  cellH = Math.min(1.05, 3.25 / rows);
                labels.forEach((label, itemIndex) => {
                  const col = itemIndex % 2,
                    row = Math.floor(itemIndex / 2),
                    cellX = x + col * (w / 2 + 0.08),
                    cellY = y + 0.82 + row * (cellH + 0.12);
                  slide.addShape(deck.ShapeType.line, {
                    x: cellX,
                    y: cellY,
                    w: 0,
                    h: cellH,
                    line: { color: heading, width: 4 },
                  });
                  slide.addText(label, {
                    x: cellX + 0.2,
                    y: cellY + 0.08,
                    w: w / 2 - 0.3,
                    h: cellH - 0.16,
                    fontFace,
                    fontSize: 13.5,
                    bold: true,
                    color: body,
                    valign: 'middle',
                    margin: 0,
                    fit: 'shrink',
                  });
                });
              }
            }
            if (visual.description.trim())
              slide.addText(visual.description, {
                x,
                y: y + 4.75,
                w,
                h: 0.58,
                fontFace,
                fontSize: 11.5,
                italic: true,
                color: body,
                margin: 0,
                align: 'left',
                valign: 'top',
                fit: 'shrink',
              });
          }
          slide.addText(String(index + 1), {
            x: 0.82,
            y: 7.03,
            w: 0.35,
            h: 0.2,
            fontFace,
            fontSize: 9,
            color: '777777',
            margin: 0,
          });
          slide.addNotes([
            `Instructional purpose: ${section.instructionalPurpose || 'explain'} · Suggested timing: ${section.timingMinutes || 3} minutes`,
            ...(section.facilitatorNotes || []),
            `Sources for this slide: ${(section.sourceRefs.length ? section.sourceRefs : document.sourcesUsed).join('; ') || 'Supplied brief'}`,
          ].join('\n\n'));
        }
        const raw = await deck.write({ outputType: 'blob' });
        const rawBlob =
          raw instanceof Blob
            ? raw
            : new Blob([raw as ArrayBuffer], {
                type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
              });
        const verified = await repairAndValidatePptxPackage(rawBlob);
        saveBlob(verified, `${baseName}.pptx`);
      } else {
        const XLSX = await import('xlsx');
        const workbook = XLSX.utils.book_new();
        const rows = [
          ['Document', advancedDocumentLabels[documentType]],
          ['Title', title],
          ['Subtitle', document.subtitle],
          ['Audience', audience],
          ['Tone', tone],
          [],
          ['Section', 'Summary', 'Key points', 'Section sources'],
          ...document.sections.map((section) => [
            section.title,
            section.summary,
            section.bullets.join('\n'),
            section.sourceRefs.join('\n'),
          ]),
        ];
        const worksheet = XLSX.utils.aoa_to_sheet(rows);
        worksheet['!cols'] = [
          { wch: 28 },
          { wch: 70 },
          { wch: 80 },
          { wch: 50 },
        ];
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Document');
        const sourceSheet = XLSX.utils.aoa_to_sheet([
          ['Sources used'],
          ...document.sourcesUsed.map((name) => [name]),
        ]);
        XLSX.utils.book_append_sheet(workbook, sourceSheet, 'Sources');
        const coverage = XLSX.utils.aoa_to_sheet([
          ['Requirement', 'Status', 'Evidence'],
          ...document.requirementCoverage.map((item) => [
            item.requirement,
            item.status,
            item.evidence,
          ]),
        ]);
        XLSX.utils.book_append_sheet(workbook, coverage, 'Coverage');
        XLSX.writeFile(workbook, `${baseName}.xlsx`, { compression: true });
      }
    } catch (error) {
      setExportError(
        error instanceof Error
          ? `Could not create the ${exportFormat.toUpperCase()} file: ${error.message}`
          : `Could not create the ${exportFormat.toUpperCase()} file.`,
      );
    } finally {
      setExporting(false);
    }
  };
  const downloadTopicDecks = async () => {
    if (!document.trainingModules?.length) return;
    setExporting(true);
    setExportError('');
    try {
      const [{ default: PptxGenJS }, { default: JSZip }] = await Promise.all([
        import('pptxgenjs'),
        import('jszip'),
      ]);
      const zip = new JSZip();
      const fontFace=effectiveFontFamily;
      const heading = effectiveColours.heading.replace('#', ''),
        body = effectiveColours.body.replace('#', ''),
        subheading = effectiveColours.subheading.replace('#', ''),
        surface = effectivePreset.surface.replace('#', '');
      for (const [moduleIndex, module] of document.trainingModules.entries()) {
        const deck = new PptxGenJS();
        deck.layout = 'LAYOUT_WIDE';
        deck.author = 'DocBeans';
        deck.company = 'Petreltech';
        deck.title = module.title;
        deck.subject = `${document.title} · Topic ${moduleIndex + 1}`;
        const opening = deck.addSlide();
        opening.background = { color: surface };
        opening.addShape(deck.ShapeType.rect, {
          x: 0,
          y: 0,
          w: 0.18,
          h: 7.5,
          fill: { color: heading },
          line: { color: heading },
        });
        opening.addText(module.title, {
          x: 0.92,
          y: 1.7,
          w: 11.1,
          h: 1.3,
          fontFace,
          fontSize: 40,
          bold: true,
          color: heading,
          margin: 0,
          fit: 'shrink',
        });
        opening.addText(professionalTrainingSubtitle(module.subtitle, 'Focused training topic'), {
          x: 0.94,
          y: 3.2,
          w: 10.7,
          h: 0.9,
          fontFace,
          fontSize: 20,
          color: body,
          margin: 0,
          fit: 'shrink',
        });
        opening.addText(
          `Topic ${moduleIndex + 1} of ${document.trainingModules.length}`,
          {
            x: 0.94,
            y: 4.45,
            w: 5,
            h: 0.3,
            fontFace,
            fontSize: 12,
            color: subheading,
            margin: 0,
          },
        );
        module.sections.forEach((section, index) => {
          const slide = deck.addSlide();
          const hasVisual = visuals === 'yes' && section.visual.type !== 'none';
          const textWidth = hasVisual ? 5.5 : 11.2;
          slide.background = { color: surface };
          slide.addText(section.title, {
            x: 0.75,
            y: 0.42,
            w: 11.8,
            h: 0.72,
            fontFace,
            fontSize: 31,
            bold: true,
            color: heading,
            margin: 0,
            fit: 'shrink',
          });
          slide.addShape(deck.ShapeType.line, {
            x: 0.75,
            y: 1.2,
            w: 11.8,
            h: 0,
            line: { color: heading, transparency: 70, width: 1 },
          });
          slide.addText(section.summary, {
            x: 0.84,
            y: 1.55,
            w: textWidth,
            h: 0.85,
            fontFace,
            fontSize: 19,
            bold: true,
            color: body,
            margin: 0,
            fit: 'shrink',
          });
          if (section.bullets.length)
            slide.addText(
              section.bullets.map((item) => ({
                text: item,
                options: {
                  bullet: { indent: 20 },
                  hanging: 5,
                  breakLine: true,
                },
              })),
              {
                x: 0.9,
                y: 2.7,
                w: textWidth,
                h: 3.7,
                fontFace,
                fontSize: 18,
                color: body,
                margin: 0.04,
                paraSpaceAfter: 12,
                valign: 'top',
                fit: 'shrink',
              },
            );
          if (hasVisual) {
            const visual = section.visual;
            const labels = (visual.labels.length ? visual.labels : visual.description.split(/[,;]|\bthen\b/i)).map(item => item.trim()).filter(Boolean).slice(0, 6);
            const x = 6.9, y = 1.55, w = 5.62;
            slide.addText(visual.title || section.title, { x, y, w, h: 0.42, fontFace, fontSize: 16, bold: true, color: subheading, margin: 0, fit: 'shrink' });
            slide.addShape(deck.ShapeType.line, { x, y: y + 0.53, w, h: 0, line: { color: heading, transparency: 65, width: 1 } });
            if (visual.type === 'chart' && visual.labels.length === visual.values.length && visual.labels.length > 1) {
              slide.addChart(deck.ChartType.bar, [{ name: visual.title || 'Source data', labels: visual.labels, values: visual.values }], { x, y: y + 0.78, w, h: 3.5, showLegend: false, showTitle: false, showValue: true, chartColors: [heading], showBorder: false });
            } else if (['process', 'timeline'].includes(visual.type)) {
              const count = Math.max(1, labels.length), gap = 0.12, cellW = (w - gap * (count - 1)) / count;
              labels.forEach((label, itemIndex) => { const cellX = x + itemIndex * (cellW + gap); if (itemIndex < count - 1) slide.addShape(deck.ShapeType.line, { x: cellX + cellW * 0.72, y: y + 1.22, w: cellW * 0.56 + gap, h: 0, line: { color: heading, transparency: 35, width: 1.5 } }); slide.addShape(deck.ShapeType.ellipse, { x: cellX + cellW / 2 - 0.23, y: y + 0.98, w: 0.46, h: 0.46, fill: { color: heading }, line: { color: heading } }); slide.addText(String(itemIndex + 1), { x: cellX + cellW / 2 - 0.23, y: y + 1.12, w: 0.46, h: 0.14, fontFace, fontSize: 9, bold: true, color: 'FFFFFF', align: 'center', margin: 0 }); slide.addText(label, { x: cellX + 0.02, y: y + 1.62, w: cellW - 0.04, h: 1.15, fontFace, fontSize: 11.5, bold: true, color: body, align: 'center', valign: 'top', margin: 0.03, fit: 'shrink' }); });
            } else if (visual.type === 'architecture') {
              const boxH = Math.min(0.62, 3.15 / Math.max(1, labels.length));
              labels.forEach((label, itemIndex) => {
                const boxY = y + 0.78 + itemIndex * (boxH + 0.13);
                slide.addShape(deck.ShapeType.roundRect, { x, y: boxY, w, h: boxH, rectRadius: 0.05, fill: { color: itemIndex % 2 ? 'FFFFFF' : heading, transparency: itemIndex % 2 ? 0 : 88 }, line: { color: heading, transparency: 55, width: 1 } });
                slide.addText(label, { x: x + 0.16, y: boxY, w: w - 0.32, h: boxH, fontFace, fontSize: 12.5, bold: true, color: body, align: 'center', valign: 'middle', margin: 0, fit: 'shrink' });
              });
            } else {
              const rows = Math.ceil(labels.length / 2), cellH = Math.min(1.05, 3.25 / Math.max(1, rows));
              labels.forEach((label, itemIndex) => { const col = itemIndex % 2, row = Math.floor(itemIndex / 2), cellX = x + col * (w / 2 + 0.08), cellY = y + 0.82 + row * (cellH + 0.12); slide.addShape(deck.ShapeType.roundRect, { x: cellX, y: cellY, w: w / 2 - 0.06, h: cellH, fill: { color: itemIndex % 2 ? 'FFFFFF' : surface }, line: { color: heading, transparency: 35, width: 1.2 } }); slide.addText(label, { x: cellX + 0.12, y: cellY + 0.08, w: w / 2 - 0.3, h: cellH - 0.16, fontFace, fontSize: 12.5, bold: true, color: body, align: 'center', valign: 'middle', margin: 0, fit: 'shrink' }); });
            }
            if (visual.description.trim()) slide.addText(visual.description, { x, y: y + 4.75, w, h: 0.58, fontFace, fontSize: 11.5, italic: true, color: body, margin: 0, align: 'left', valign: 'top', fit: 'shrink' });
          }
          slide.addText(String(index + 1), {
            x: 0.84,
            y: 7.02,
            w: 0.4,
            h: 0.2,
            fontFace,
            fontSize: 9,
            color: '777777',
            margin: 0,
          });
          slide.addNotes([
            `Instructional purpose: ${section.instructionalPurpose || 'explain'} · Suggested timing: ${section.timingMinutes || 3} minutes`,
            ...(section.facilitatorNotes || []),
            `Sources: ${section.sourceRefs.join('; ') || 'Approved course knowledge'}`,
          ].join('\n\n'));
        });
        const raw = await deck.write({ outputType: 'blob' });
        const rawBlob =
          raw instanceof Blob
            ? raw
            : new Blob([raw as ArrayBuffer], {
                type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
              });
        const verified = await repairAndValidatePptxPackage(rawBlob);
        const moduleName =
          module.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '') || `topic-${moduleIndex + 1}`;
        zip.file(
          `${String(moduleIndex + 1).padStart(2, '0')}-${moduleName}.pptx`,
          verified,
        );
      }
      zip.file(
        'course-outline.txt',
        [
          document.title,
          document.subtitle,
          '',
          ...document.trainingModules.map(
            (module, index) =>
              `${index + 1}. ${module.title}\n${module.subtitle}`,
          ),
        ].join('\n'),
      );
      saveBlob(
        await zip.generateAsync({ type: 'blob' }),
        `${baseName}-topic-decks.zip`,
      );
    } catch (error) {
      setExportError(
        error instanceof Error
          ? `Could not create the topic PowerPoint pack: ${error.message}`
          : 'Could not create the topic PowerPoint pack.',
      );
    } finally {
      setExporting(false);
    }
  };
  return (
    <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_310px]">
      <section className="overflow-hidden rounded-[22px] border border-border bg-card shadow-[0_16px_50px_rgba(39,70,54,0.07)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-[#fafafa] px-5 py-3">
          <div className="flex gap-1">
            {draftTabs.map((item) => (
              <button
                type="button"
                key={item}
                onClick={() => setTab(item)}
                className={`rounded-lg px-3 py-2 text-xs font-semibold capitalize ${tab === item ? 'bg-white text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {item}
              </button>
            ))}
          </div>
          <Button size="sm" variant="outline" onClick={onEditBrief}>
            Edit brief
          </Button>
        </div>
        {tab === 'document' && (
          <article
            className="mx-auto max-w-[800px] px-7 py-10 sm:px-12"
            style={{
              ...previewStyle(font, colours),
              backgroundColor: preset.surface,
              borderColor: preset.border,
            }}
          >
            <DocumentHeader
              label={advancedDocumentLabels[documentType]}
              title={document.title}
              font={font}
              colours={colours}
              style="executive"
            />
            <p
              className="mt-3 text-base leading-7"
              style={{ color: colours.subheading }}
            >
              {visibleSubtitle}
            </p>
            <p className="mt-3 text-sm" style={{ color: colours.subheading }}>
              For {audience} · {tone}
            </p>
            <div className="mt-9 space-y-9">
              {document.sections.map((section, index) => (
                <section key={`${section.title}-${index}`}>
                  <div className="flex items-start gap-3">
                    <span
                      className="mt-1 grid size-7 shrink-0 place-items-center rounded-md text-xs font-semibold text-white"
                      style={{ backgroundColor: colours.heading }}
                    >
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3
                        className="text-xl font-semibold tracking-tight"
                        style={{ color: colours.subheading }}
                      >
                        {section.title}
                      </h3>
                      <p
                        className="mt-2 text-base leading-7"
                        style={{ color: colours.body }}
                      >
                        {section.summary}
                      </p>
                      {section.bullets.length > 0 && (
                        <ul
                          className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6"
                          style={{ color: colours.body }}
                        >
                          {section.bullets.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      )}
                      {section.visual.type !== 'none' && (
                        <AdvancedVisualPreview
                          section={section}
                          source={sources.find(
                            (source) =>
                              source.kind === 'image' &&
                              source.name === section.visual.sourceName &&
                              source.dataUrl,
                          )}
                          colours={colours}
                          preset={preset}
                        />
                      )}
                      {section.sourceRefs.length > 0 && (
                        <p className="mt-3 text-[11px] leading-5 text-muted-foreground">
                          Sources: {section.sourceRefs.join(' · ')}
                        </p>
                      )}
                      {(section.facilitatorNotes || []).length > 0 && (
                        <details className="mt-4 rounded-xl border border-border bg-muted/35 px-4 py-3">
                          <summary className="cursor-pointer text-sm font-semibold text-foreground">
                            Facilitator notes
                          </summary>
                          <p className="mt-3 text-xs font-semibold uppercase tracking-[.06em] text-muted-foreground">
                            Suggested timing: {section.timingMinutes || 3} minutes · {section.instructionalPurpose || 'explain'}
                          </p>
                          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-muted-foreground">
                            {section.facilitatorNotes.map((note) => (
                              <li key={note}>{note}</li>
                            ))}
                          </ul>
                        </details>
                      )}
                    </div>
                  </div>
                </section>
              ))}
            </div>
          </article>
        )}
        {tab === 'topics' && (
          <div className="p-6 sm:p-8">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">
                  Topic PowerPoint files
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Each topic was generated and validated independently.
                </p>
              </div>
              <Badge variant="secondary">
                {document.trainingModules?.length || 0} files
              </Badge>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {document.trainingModules?.map((module, index) => (
                <div
                  key={`${module.title}-${index}`}
                  className="rounded-xl border border-border p-4"
                >
                  <p className="text-xs font-semibold uppercase tracking-[.08em] text-primary">
                    Topic {index + 1}
                  </p>
                  <h3 className="mt-2 text-sm font-semibold">{module.title}</h3>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">
                    {professionalTrainingSubtitle(module.subtitle, 'Focused training topic')}
                  </p>
                  <p className="mt-3 text-xs font-medium">
                    {module.sections.length} slides
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
        {tab === 'coverage' && (
          <div className="p-6 sm:p-8">
            <h2 className="text-lg font-semibold">Requirement coverage</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              The provider linked each requirement to evidence in the developed
              content.
            </p>
            <div className="mt-5 space-y-3">
              {(document.requirementCoverage.length
                ? document.requirementCoverage
                : requirements.map((req) => ({
                    requirement: req.text,
                    status: 'review' as const,
                    evidence: 'Confirm during human review.',
                  }))
              ).map((item) => (
                <div
                  key={item.requirement}
                  className="rounded-xl border border-border p-4"
                >
                  <div className="flex items-start gap-3">
                    <span className="grid size-6 place-items-center rounded-full bg-[#ececea] text-primary">
                      <Check className="size-3.5" />
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{item.requirement}</p>
                      <p className="mt-2 text-xs leading-5 text-muted-foreground">
                        {item.evidence}
                      </p>
                    </div>
                    <Badge
                      className={
                        item.status === 'addressed'
                          ? 'bg-[#ececea] text-primary'
                          : 'bg-amber-50 text-amber-800'
                      }
                    >
                      {item.status === 'addressed' ? 'Addressed' : 'Review'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {tab === 'sources' && (
          <div className="p-6 sm:p-8">
            <h2 className="text-lg font-semibold">Knowledge trace</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Approved inputs and any external websites retained in the
              generated response.
            </p>
            <div className="mt-5 space-y-3">
              {sources
                .filter((source) => source.status === 'Ready')
                .map((source) => (
                  <div
                    key={source.id}
                    className="flex items-center gap-3 rounded-xl border border-border p-4"
                  >
                    {source.kind === 'website' ? (
                      <Globe2 className="size-4 text-primary" />
                    ) : (
                      <FileText className="size-4 text-primary" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{source.name}</p>
                      {source.url ? (
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 block truncate text-xs text-primary underline-offset-2 hover:underline"
                        >
                          {source.url}
                        </a>
                      ) : (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {source.meta}
                        </p>
                      )}
                    </div>
                    <Badge variant="outline">
                      {document.sourcesUsed.includes(source.name) ||
                      Boolean(
                        source.url && document.sourcesUsed.includes(source.url),
                      )
                        ? 'Used'
                        : 'Supplied'}
                    </Badge>
                  </div>
                ))}
              {externalReferences.map((reference) => (
                <div
                  key={reference}
                  className="flex items-center gap-3 rounded-xl border border-border p-4"
                >
                  <Globe2 className="size-4 text-primary" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">External website</p>
                    <a
                      href={reference}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 block truncate text-xs text-primary underline-offset-2 hover:underline"
                    >
                      {reference}
                    </a>
                  </div>
                  <Badge variant="outline">Used</Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
      <aside className="space-y-4">
        {documentType === 'training-material' && (
          <div className="rounded-[20px] border border-primary/25 bg-secondary/45 p-5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold">Exercise pack</h3>
              <Badge
                className={
                  hasExercises
                    ? 'bg-emerald-50 text-emerald-800'
                    : 'bg-amber-50 text-amber-800'
                }
              >
                {hasExercises ? 'Attached' : 'After approval'}
              </Badge>
            </div>
            <p className="mt-3 text-xs leading-5 text-muted-foreground">
              {hasExercises
                ? 'The exercises are attached to this approved document and included in downloads.'
                : `Approve the core content, then create ${trainingExerciseTypes.map((type) => trainingExerciseLabels[type]).join(', ')} from this exact version.`}
            </p>
            <div className="mt-3 rounded-lg bg-white/80 px-3 py-2 text-xs">
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">
                  Recommended exercise budget
                </span>
                <strong>
                  {recommendedExerciseTokens.toLocaleString()} tokens
                </strong>
              </div>
            </div>
            <Button
              className="mt-4 w-full"
              onClick={onGenerateExercises}
              disabled={exerciseGenerating || hasExercises}
            >
              {exerciseGenerating
                ? 'Creating aligned exercises…'
                : hasExercises
                  ? 'Exercises attached'
                  : 'Approve content and create exercises'}
            </Button>
            {exerciseUsage && (
              <p className="mt-3 text-xs text-muted-foreground">
                Exercise generation used{' '}
                {exerciseUsage.totalTokens.toLocaleString()} tokens.
              </p>
            )}
            {exerciseError && (
              <p
                role="alert"
                className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs leading-5 text-red-800"
              >
                {exerciseError}
              </p>
            )}
          </div>
        )}
        <div className="rounded-[20px] border border-border bg-card p-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold">Output settings</h3>
            <Badge className="bg-emerald-50 text-emerald-800">
              <CheckCircle2 className="size-3" /> Validated
            </Badge>
          </div>
          <dl className="mt-4 space-y-3 text-xs">
            <div>
              <dt className="text-muted-foreground">Document</dt>
              <dd className="mt-1 font-medium">
                {advancedDocumentLabels[documentType]}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Grounding</dt>
              <dd className="mt-1 font-medium">
                {groundingMode === 'approved-only'
                  ? 'Approved sources only'
                  : 'Approved + external web'}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Download</dt>
              <dd className="mt-1 font-medium">{exportFormat.toUpperCase()}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Design</dt>
              <dd className="mt-1 font-medium">
                {preset.label} · {documentFonts[font].label.split(' · ')[0]}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Visuals</dt>
              <dd className="mt-1 font-medium">
                {
                  document.sections.filter(
                    (section) => section.visual.type !== 'none',
                  ).length
                }{' '}
                developed
              </dd>
            </div>
            {document.trainingModules?.length && (
              <div>
                <dt className="text-muted-foreground">Topic PowerPoints</dt>
                <dd className="mt-1 font-medium">
                  {document.trainingModules.length} files ·{' '}
                  {document.sections.length} slides
                </dd>
              </div>
            )}
            <div>
              <dt className="text-muted-foreground">Quality</dt>
              <dd className="mt-1 font-medium">
                {document.quality.score}/100 ·{' '}
                {document.quality.status === 'ready'
                  ? 'Ready'
                  : 'Review advised'}
              </dd>
            </div>
            {exportFormat === 'pptx' && (
              <div>
                <dt className="text-muted-foreground">PPTX package</dt>
                <dd className="mt-1 font-medium">
                  Repaired and verified before download
                </dd>
              </div>
            )}
          </dl>
          {document.trainingModules?.length && (
            <Button
              className="mt-5 w-full"
              onClick={downloadTopicDecks}
              disabled={exporting}
            >
              <Download />{' '}
              {exporting ? 'Creating topic pack…' : 'Download topic PPTX pack'}
            </Button>
          )}
          <Button
            className={
              document.trainingModules?.length ? 'mt-2 w-full' : 'mt-5 w-full'
            }
            onClick={downloadAdvancedDocument}
            disabled={exporting}
          >
            <Download />{' '}
            {exporting
              ? `Creating ${exportFormat.toUpperCase()}…`
              : `Download complete ${exportFormat.toUpperCase()}`}
          </Button>
          {exportError && (
            <p
              role="alert"
              className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs leading-5 text-red-800"
            >
              {exportError}
            </p>
          )}
        </div>
        {usage && (
          <div className="rounded-[20px] border border-border bg-card p-5">
            <h3 className="text-sm font-semibold">AI generation</h3>
            <dl className="mt-3 space-y-2 text-xs">
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Model</dt>
                <dd className="text-right font-medium">{usage.model}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Tokens</dt>
                <dd className="font-medium">
                  {usage.totalTokens.toLocaleString()}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Credits</dt>
                <dd className="font-medium">{usage.credits}</dd>
              </div>
            </dl>
            {notice && (
              <p className="mt-3 text-xs leading-5 text-muted-foreground">
                {notice}
              </p>
            )}
          </div>
        )}
        <div className="rounded-[20px] bg-[#161616] p-5 text-white">
          <ShieldCheck className="size-4 text-[#d6d6d2]" />
          <h3 className="mt-3 text-sm font-semibold">Human review required</h3>
          <p className="mt-2 text-xs leading-5 text-white/70">
            Review facts, claims and visuals in the Document tab. The download
            was unlocked only after content, source, instructional and visual
            checks passed. PPTX package integrity is checked during export.
          </p>
        </div>
      </aside>
    </div>
  );
}

function AdvancedVisualPreview({
  section,
  source,
  colours,
  preset,
}: {
  section: AdvancedSection;
  source?: Source;
  colours: DocumentColours;
  preset: (typeof documentThemes)[DocumentTheme];
}) {
  const visual = section.visual;
  const labels = (
    visual.labels.length
      ? visual.labels
      : visual.description.split(/[,;]|\bthen\b/i)
  )
    .filter(Boolean)
    .slice(0, 6);
  return (
    <div
      className="mt-5 rounded-xl border p-4"
      style={{ borderColor: preset.border, backgroundColor: preset.soft }}
    >
      <p
        className="text-xs font-semibold uppercase tracking-[.08em]"
        style={{ color: colours.subheading }}
      >
        {visual.title || 'Supporting visual'}
      </p>
      {visual.type === 'source-image' && source?.dataUrl ? (
        <img
          src={source.dataUrl}
          alt={visual.description || source.name}
          className="mt-3 max-h-72 w-full rounded-lg bg-white object-contain"
        />
      ) : visual.type === 'chart' &&
        visual.labels.length === visual.values.length ? (
        <div className="mt-4 space-y-2">
          {visual.labels.map((label, index) => {
            const max = Math.max(...visual.values, 1);
            return (
              <div
                key={label}
                className="grid grid-cols-[120px_1fr_42px] items-center gap-2 text-xs"
              >
                <span className="truncate">{label}</span>
                <span className="h-3 overflow-hidden rounded-full bg-white">
                  <span
                    className="block h-full rounded-full"
                    style={{
                      width: `${Math.max(4, (visual.values[index] / max) * 100)}%`,
                      backgroundColor: colours.heading,
                    }}
                  />
                </span>
                <span className="text-right font-semibold">
                  {visual.values[index]}
                </span>
              </div>
            );
          })}
        </div>
      ) : ['process', 'timeline'].includes(visual.type) ? (
        <div className="mt-4 grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.max(1, labels.length)}, minmax(0, 1fr))` }}>
          {labels.map((label, index) => (
            <div key={`${label}-${index}`} className="relative flex min-h-28 flex-col items-center text-center">
              {index < labels.length - 1 && <span className="absolute left-[60%] top-3.5 h-px w-[80%]" style={{ backgroundColor: colours.heading }} />}
              <span
                className="relative z-10 grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold text-white"
                style={{ backgroundColor: colours.heading }}
              >
                {index + 1}
              </span>
              <span
                className="mt-3 text-xs font-semibold leading-5"
                style={{ color: colours.body }}
              >
                {label}
              </span>
            </div>
          ))}
        </div>
      ) : visual.type === 'architecture' ? (
        <div className="mt-4 space-y-2">
          {labels.map((label, index) => (
            <div key={`${label}-${index}`} className="rounded-md border bg-white px-4 py-3 text-center text-xs font-semibold leading-5" style={{ borderColor: index % 2 ? preset.border : colours.heading, color: colours.body }}>
              {label}
            </div>
          ))}
        </div>
      ) : visual.type === 'cycle' ? (
        <div className="mx-auto mt-4 grid max-w-sm grid-cols-2 gap-3">
          {labels.slice(0, 4).map((label, index) => (
            <span
              key={`${label}-${index}`}
              className="grid min-h-20 place-items-center rounded-full border bg-white px-4 text-center text-xs font-semibold leading-5"
              style={{ borderColor: colours.heading, color: colours.body }}
            >
              {label}
            </span>
          ))}
        </div>
      ) : (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {labels.map((label, index) => (
            <span
              key={`${label}-${index}`}
              className="border-l-4 bg-white px-3 py-3 text-center text-xs font-semibold leading-5"
              style={{ borderColor: colours.heading, color: colours.body }}
            >
              {label}
            </span>
          ))}
        </div>
      )}
      <p className="mt-3 text-xs leading-5" style={{ color: colours.body }}>
        {visual.description}
      </p>
    </div>
  );
}

function Choice({
  active = false,
  title,
  text,
  onClick,
}: {
  active?: boolean;
  title: string;
  text: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`rounded-xl border p-3 text-left transition ${active ? 'border-primary bg-[#f4f4f2] ring-1 ring-primary/15' : 'border-border bg-white hover:border-primary/40'}`}
    >
      <span className="flex items-center justify-between">
        <span className="text-sm font-semibold">{title}</span>
        <span
          className={`grid size-4 place-items-center rounded-full border ${active ? 'border-primary bg-primary text-white' : 'border-input'}`}
        >
          {active && <Check className="size-2.5" />}
        </span>
      </span>
      <span className="mt-1 block text-[11px] text-muted-foreground">
        {text}
      </span>
    </button>
  );
}
function InfoBox({
  icon: Icon,
  title,
  children,
  className = '',
}: {
  icon: typeof Sparkles;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-[#dededb] bg-[#f4f4f2] p-4 ${className}`}
    >
      <div className="flex gap-3">
        <Icon className="mt-0.5 size-4 shrink-0 text-primary" />
        <div>
          <p className="text-sm font-semibold">{title}</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {children}
          </p>
        </div>
      </div>
    </div>
  );
}
function ReviewStat({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof FileText;
  value: string;
  label: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-[#fafafa] p-4">
      <Icon className="size-4 text-primary" />
      <div className="mt-2 text-lg font-semibold">{value}</div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
    </div>
  );
}
function QualityBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold">{value}%</span>
      </div>
      <div className="mt-2 h-1.5 rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
