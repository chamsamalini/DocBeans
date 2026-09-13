'use client';

import { useRef, useState } from 'react';
import {
  ArrowLeft, ArrowRight, Bell, BookOpen, Check, CheckCircle2, ChevronDown,
  CircleHelp, ClipboardCheck, Copy, DollarSign, Download, FileText,
  LayoutTemplate, Plus, Search, Settings, ShieldCheck, Sparkles,
  Trash2, UploadCloud, Users, WandSparkles, X, Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatGeneratedJob } from '@/lib/job-generation';
import type { AdvancedDocument, AdvancedGenerationResponse, AdvancedSection, GeneratedJobDocument, GeneratedQuickDocument, GenerationUsage, JobGenerationResponse, QuickGenerationResponse } from '@/lib/job-generation';
import { loadAiSettings } from '@/lib/ai-settings';
import { extractKnowledgeFile } from '@/lib/knowledge-extraction';
import { SiteFooter } from '@/components/site-footer';
import { BrandLogo } from '@/components/brand-logo';

type Requirement = { id: number; text: string; mandatory: boolean };
type Source = { id: number; name: string; meta: string; status: 'Ready' | 'Checking' | 'Error'; mimeType:string; kind:'text'|'image'; content:string; dataUrl?:string };
type QuickDocumentType = 'appreciation' | 'recommendation' | 'testimonial' | 'thank-you' | 'cover-letter' | 'quotation' | 'proposal' | 'project-brief' | 'executive-summary' | 'curriculum' | 'job-description' | 'memo' | 'announcement' | 'meeting-agenda' | 'meeting-minutes' | 'sop' | 'leave' | 'medical-leave';
type DocumentFont = 'source-sans' | 'playfair' | 'montserrat' | 'georgia' | 'times';
type DocumentTheme = 'minimal' | 'corporate' | 'warm' | 'editorial' | 'formal';
type DocumentHeaderStyle = 'executive' | 'classic' | 'minimal';
type DocumentSubheaderStyle = 'compact' | 'balanced' | 'prominent';
type DocumentColours = { body:string; heading:string; subheading:string };
type ExportFormat = 'pdf' | 'docx' | 'pptx' | 'txt' | 'xlsx';
type AdvancedDocumentType = 'presentation' | 'report' | 'business-proposal' | 'executive-brief' | 'policy' | 'training-material' | 'research-summary' | 'custom';
type VisualPreference = 'yes' | 'no';
type JobPostDetails = { qualifications: string; preferredQualifications: string; benefits: string; application: string; companyUrl: string };
type QuickDocumentConfig = {
  label: string; noun: string; heading: string; description: string;
  primaryLabel: string; primaryPlaceholder: string;
  detailLabel: string; detailPlaceholder: string; detailHelp: string;
  secondaryLabel?: string; secondaryPlaceholder?: string;
  tones: string[]; checklist: string[];
};

const documentFonts: Record<DocumentFont, { label:string; family:string }> = {
  'source-sans': { label: 'Source Sans 3 · Clean', family: 'var(--font-source-sans), Arial, sans-serif' },
  playfair: { label: 'Playfair Display · Elegant', family: 'var(--font-playfair), Georgia, serif' },
  montserrat: { label: 'Montserrat · Modern', family: 'var(--font-montserrat), Arial, sans-serif' },
  georgia: { label: 'Georgia · Classic', family: 'Georgia, Times, serif' },
  times: { label: 'Times New Roman · Traditional', family: '"Times New Roman", Times, serif' },
};

const documentThemes: Record<DocumentTheme, { label:string; description:string; surface:string; accent:string; soft:string; text:string; border:string }> = {
  minimal: { label: 'Minimal', description: 'Clean black and white', surface: '#ffffff', accent: '#161616', soft: '#f1f1ef', text: '#353535', border: '#dededb' },
  corporate: { label: 'Corporate blue', description: 'Structured and authoritative', surface: '#fbfcff', accent: '#1e3a5f', soft: '#eaf0f6', text: '#293746', border: '#c5d2df' },
  warm: { label: 'Warm ivory', description: 'Personal and approachable', surface: '#fffaf4', accent: '#8b4a2f', soft: '#f5e9dd', text: '#4d3a32', border: '#dec8b8' },
  editorial: { label: 'Editorial', description: 'Refined and publication-ready', surface: '#fffdf8', accent: '#51483e', soft: '#eee8dd', text: '#3f3a34', border: '#d7cec0' },
  formal: { label: 'Formal green', description: 'Professional and established', surface: '#fbfdfb', accent: '#1f4b38', soft: '#e7f0eb', text: '#31443b', border: '#bfd0c6' },
};

const quickDocuments: Record<QuickDocumentType, QuickDocumentConfig> = {
  appreciation: { label: 'Appreciation letter', noun: 'letter', heading: 'Write an appreciation letter', description: 'Recognise someone’s contribution with a thoughtful, professional message.', primaryLabel: 'Who is it for?', primaryPlaceholder: 'e.g. Hamsi', detailLabel: 'What would you like to recognise?', detailPlaceholder: 'Describe what they did and the difference it made…', detailHelp: 'Include a specific contribution and its positive impact.', tones: ['Warm and sincere', 'Professional and appreciative', 'Concise and heartfelt', 'Formal recognition'], checklist: ['Recipient', 'Contribution and impact', 'Preferred tone'] },
  recommendation: { label: 'Recommendation letter', noun: 'letter', heading: 'Write a recommendation letter', description: 'Turn evidence of someone’s strengths into a credible recommendation.', primaryLabel: 'Who are you recommending?', primaryPlaceholder: 'e.g. Hamsi', detailLabel: 'Which strengths and achievements should be highlighted?', detailPlaceholder: 'Share specific skills, examples and results…', detailHelp: 'Specific evidence makes the recommendation more credible.', secondaryLabel: 'What are they being recommended for?', secondaryPlaceholder: 'e.g. Senior Data Coach role', tones: ['Professional and confident', 'Warm and supportive', 'Formal and authoritative', 'Concise and direct'], checklist: ['Candidate', 'Strengths and evidence', 'Opportunity or purpose'] },
  quotation: { label: 'Business quotation', noun: 'quotation', heading: 'Create a business quotation', description: 'Prepare a clear commercial quote with scope, pricing and terms.', primaryLabel: 'Who is the quotation for?', primaryPlaceholder: 'Client or company name', detailLabel: 'What are you quoting?', detailPlaceholder: 'List services or products, quantities and prices…', detailHelp: 'Include currency, taxes and any important exclusions.', secondaryLabel: 'Validity and payment terms', secondaryPlaceholder: 'e.g. Valid 30 days · 50% upfront', tones: ['Professional and clear', 'Concise and commercial', 'Formal and detailed'], checklist: ['Client', 'Items and pricing', 'Commercial terms'] },
  curriculum: { label: 'Curriculum structure', noun: 'curriculum', heading: 'Design a curriculum structure', description: 'Organise learning outcomes into a practical sequence of modules.', primaryLabel: 'Course or programme name', primaryPlaceholder: 'e.g. AI Fluency for Consultants', detailLabel: 'Who are the learners and what should they achieve?', detailPlaceholder: 'Describe the audience, starting level and learning outcomes…', detailHelp: 'Focus on observable skills learners should demonstrate.', secondaryLabel: 'Duration or number of modules', secondaryPlaceholder: 'e.g. 6 weeks · 8 modules', tones: ['Practical and instructional', 'Academic and structured', 'Executive and concise'], checklist: ['Programme', 'Learners and outcomes', 'Duration or modules'] },
  proposal: { label: 'Business proposal', noun: 'proposal', heading: 'Create a business proposal', description: 'Shape a business need into a focused, persuasive proposal.', primaryLabel: 'Who is the proposal for?', primaryPlaceholder: 'Client, sponsor or organisation', detailLabel: 'What problem will you solve and how?', detailPlaceholder: 'Describe the need, proposed solution and expected value…', detailHelp: 'Add measurable benefits when possible.', secondaryLabel: 'Commercial terms or next step', secondaryPlaceholder: 'e.g. SGD 25,000 · approve discovery workshop', tones: ['Persuasive and professional', 'Executive and concise', 'Consultative and practical', 'Formal and detailed'], checklist: ['Audience', 'Problem, solution and value', 'Terms or next step'] },
  leave: { label: 'Leave request', noun: 'request', heading: 'Write a leave request', description: 'Create a respectful request with dates and a clear handover plan.', primaryLabel: 'Who is the request addressed to?', primaryPlaceholder: 'Manager or HR contact', detailLabel: 'When will you be away and how will work be covered?', detailPlaceholder: 'Add dates, return date and handover arrangements…', detailHelp: 'Only include personal details you are comfortable sharing.', secondaryLabel: 'Reason (optional)', secondaryPlaceholder: 'e.g. Personal leave', tones: ['Professional and courteous', 'Warm and respectful', 'Formal and concise'], checklist: ['Approver', 'Leave dates', 'Coverage plan'] },
  'medical-leave': { label: 'Medical leave request', noun: 'request', heading: 'Write a medical leave request', description: 'Communicate medical leave professionally without unnecessary health details.', primaryLabel: 'Who is the request addressed to?', primaryPlaceholder: 'Manager or HR contact', detailLabel: 'What are the leave dates and work-coverage arrangements?', detailPlaceholder: 'Add dates, expected return and urgent handover details…', detailHelp: 'A diagnosis is not required. Share only what is necessary.', secondaryLabel: 'Supporting note (optional)', secondaryPlaceholder: 'e.g. Medical certificate available', tones: ['Professional and discreet', 'Formal and concise', 'Warm and respectful'], checklist: ['Approver', 'Medical leave dates', 'Coverage or certificate'] },
  testimonial: { label: 'Testimonial', noun: 'testimonial', heading: 'Write a testimonial', description: 'Turn a real experience into a specific and credible endorsement.', primaryLabel: 'Who or what is the testimonial about?', primaryPlaceholder: 'Person, company, product or service', detailLabel: 'What was your experience and result?', detailPlaceholder: 'Describe the situation, what stood out and the outcome…', detailHelp: 'Concrete results make a testimonial more trustworthy.', secondaryLabel: 'Where will it be used?', secondaryPlaceholder: 'e.g. Website, LinkedIn or proposal', tones: ['Authentic and enthusiastic', 'Professional and credible', 'Warm and conversational', 'Concise and punchy'], checklist: ['Subject', 'Experience and outcome', 'Intended use'] },
  'thank-you': { label: 'Thank-you email', noun: 'email', heading: 'Write a thank-you email', description: 'Send a brief, genuine message of thanks.', primaryLabel: 'Who are you thanking?', primaryPlaceholder: 'Person or team', detailLabel: 'What are you thanking them for?', detailPlaceholder: 'Describe what they did and why it mattered…', detailHelp: 'A specific detail makes the message feel genuine.', secondaryLabel: 'Any next step?', secondaryPlaceholder: 'e.g. Looking forward to working together', tones: ['Warm and sincere', 'Professional and concise', 'Friendly and conversational'], checklist: ['Recipient', 'Reason for thanks', 'Closing or next step'] },
  'cover-letter': { label: 'Cover letter', noun: 'letter', heading: 'Write a cover letter', description: 'Connect your experience to a specific role and employer.', primaryLabel: 'Which role and organisation?', primaryPlaceholder: 'e.g. Product Manager at Chams', detailLabel: 'Which experience and strengths are most relevant?', detailPlaceholder: 'Share achievements, skills and motivation…', detailHelp: 'Use evidence that directly matches the opportunity.', secondaryLabel: 'Hiring manager or recipient (optional)', secondaryPlaceholder: 'Name or hiring team', tones: ['Confident and professional', 'Warm and enthusiastic', 'Concise and direct'], checklist: ['Role and company', 'Relevant evidence', 'Motivation'] },
  'project-brief': { label: 'Project brief', noun: 'brief', heading: 'Create a project brief', description: 'Capture a project’s purpose, scope and expected outcome.', primaryLabel: 'What is the project called?', primaryPlaceholder: 'Project or initiative name', detailLabel: 'What should the project achieve?', detailPlaceholder: 'Describe the problem, scope, deliverables and success measures…', detailHelp: 'Include what is in scope and what success looks like.', secondaryLabel: 'Owner, deadline or key constraint', secondaryPlaceholder: 'e.g. Product team · launch by December', tones: ['Clear and practical', 'Executive and concise', 'Structured and detailed'], checklist: ['Project', 'Scope and outcomes', 'Ownership or constraints'] },
  'executive-summary': { label: 'Executive summary', noun: 'summary', heading: 'Create an executive summary', description: 'Condense complex information into the points leaders need.', primaryLabel: 'What is being summarised?', primaryPlaceholder: 'Report, initiative or decision topic', detailLabel: 'What are the essential facts and findings?', detailPlaceholder: 'Paste the key context, evidence and conclusions…', detailHelp: 'Prioritise implications, risks and decisions over background.', secondaryLabel: 'Decision or action required', secondaryPlaceholder: 'e.g. Approve the recommended option', tones: ['Executive and concise', 'Analytical and neutral', 'Persuasive and decisive'], checklist: ['Subject', 'Key findings', 'Decision or action'] },
  'job-description': { label: 'Job description', noun: 'description', heading: 'Create a job description', description: 'Define a role with clear responsibilities and success expectations.', primaryLabel: 'What is the job title?', primaryPlaceholder: 'e.g. Senior Data Analyst', detailLabel: 'What will this person own and deliver?', detailPlaceholder: 'Describe responsibilities, skills and expected outcomes…', detailHelp: 'Separate essential requirements from preferences.', secondaryLabel: 'Team, location or employment type', secondaryPlaceholder: 'e.g. AI team · Singapore · Full-time', tones: ['Professional and inclusive', 'Clear and practical', 'Engaging and candidate-friendly'], checklist: ['Role', 'Responsibilities and skills', 'Working context'] },
  memo: { label: 'Internal memo', noun: 'memo', heading: 'Write an internal memo', description: 'Communicate an internal decision, update or instruction clearly.', primaryLabel: 'Who is the memo for?', primaryPlaceholder: 'Team, department or organisation', detailLabel: 'What do people need to know?', detailPlaceholder: 'Describe the context, decision and implications…', detailHelp: 'Lead with the message, then explain why it matters.', secondaryLabel: 'Action or effective date', secondaryPlaceholder: 'e.g. New process starts 1 October', tones: ['Clear and professional', 'Direct and concise', 'Supportive and explanatory'], checklist: ['Audience', 'Core message', 'Action or timing'] },
  announcement: { label: 'Announcement', noun: 'announcement', heading: 'Write an announcement', description: 'Share news with the right context and next steps.', primaryLabel: 'Who is the announcement for?', primaryPlaceholder: 'Employees, customers or community', detailLabel: 'What are you announcing?', detailPlaceholder: 'Describe the news, why it matters and key details…', detailHelp: 'Answer what is changing, when and who is affected.', secondaryLabel: 'Call to action or contact', secondaryPlaceholder: 'e.g. Register by Friday · Contact People Ops', tones: ['Positive and professional', 'Clear and informative', 'Celebratory and warm'], checklist: ['Audience', 'News and significance', 'Next step'] },
  'meeting-agenda': { label: 'Meeting agenda', noun: 'agenda', heading: 'Create a meeting agenda', description: 'Turn a meeting objective into a focused, timed agenda.', primaryLabel: 'What is the meeting?', primaryPlaceholder: 'Meeting title', detailLabel: 'What must be discussed or decided?', detailPlaceholder: 'List topics, decisions and desired outcomes…', detailHelp: 'Prioritise decisions and preparation over status updates.', secondaryLabel: 'Date, duration or attendees', secondaryPlaceholder: 'e.g. 60 minutes · Product and Sales leads', tones: ['Focused and practical', 'Formal and structured', 'Collaborative and clear'], checklist: ['Meeting purpose', 'Topics and decisions', 'Timing or attendees'] },
  'meeting-minutes': { label: 'Meeting minutes', noun: 'minutes', heading: 'Create meeting minutes', description: 'Convert meeting notes into decisions and accountable actions.', primaryLabel: 'Which meeting was held?', primaryPlaceholder: 'Meeting title and date', detailLabel: 'What was discussed and decided?', detailPlaceholder: 'Paste notes, decisions, owners and deadlines…', detailHelp: 'Include names only where ownership or attribution matters.', secondaryLabel: 'Attendees (optional)', secondaryPlaceholder: 'Names or teams', tones: ['Objective and structured', 'Concise and action-focused', 'Formal and detailed'], checklist: ['Meeting', 'Decisions and discussion', 'Owners and actions'] },
  sop: { label: 'Standard operating procedure', noun: 'procedure', heading: 'Create a standard operating procedure', description: 'Turn a repeatable task into clear, controlled steps.', primaryLabel: 'What process is this for?', primaryPlaceholder: 'Process or procedure name', detailLabel: 'How is the work performed?', detailPlaceholder: 'Describe triggers, steps, roles, checks and exceptions…', detailHelp: 'Write steps in the order a new team member would follow.', secondaryLabel: 'Owner, tools or policy reference', secondaryPlaceholder: 'e.g. Operations · CRM · Policy HR-04', tones: ['Precise and instructional', 'Clear and practical', 'Formal and controlled'], checklist: ['Process', 'Steps and controls', 'Owner or references'] },
};

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

const audienceOptions = ['Executive leadership', 'Board or investors', 'Clients or customers', 'Employees or internal teams', 'Learners or trainees', 'Technical specialists', 'General public'];
const advancedToneOptions = ['Professional and engaging', 'Executive and concise', 'Persuasive and confident', 'Clear and instructional', 'Formal and authoritative', 'Warm and conversational', 'Technical and precise'];

function getAdvancedDraftSections(documentType:AdvancedDocumentType, purpose:string, visuals:VisualPreference): [string,string][] {
  const objective = purpose || `Develop a clear ${advancedDocumentLabels[documentType].toLowerCase()} from the supplied knowledge.`;
  const visualNote = visuals === 'yes' ? ' Include a purposeful chart, diagram, image or layout suggestion where it strengthens understanding.' : '';
  if (documentType === 'presentation') return [
    ['Opening slide', objective],
    ['Context and evidence', `Introduce the essential background and strongest source-supported facts.${visualNote}`],
    ['Core message', `Build a focused narrative around the principal findings, proposal or recommendation.${visualNote}`],
    ['Closing slide', 'Summarise the takeaway and make the requested response or next step explicit.'],
  ];
  if (documentType === 'report' || documentType === 'research-summary') return [['Executive summary', objective],['Evidence and findings','Organise the supplied evidence into clear themes, separating facts from interpretation.'],['Analysis','Explain implications, limitations and material risks.'],['Conclusion and next steps','Summarise what the reader should understand or do next.']];
  if (documentType === 'business-proposal') return [['Proposal summary', objective],['Need and opportunity','Describe the client or business need using supplied evidence.'],['Proposed solution','Set out the approach, scope, deliverables and value.'],['Commercials and next step','Present assumptions, terms and the action required to proceed.']];
  if (documentType === 'training-material') return [['Learning purpose', objective],['Learning outcomes','Define what learners should understand or be able to do.'],['Content sequence',`Organise topics and activities into a logical learning path.${visualNote}`],['Assessment and application','Confirm how learning will be practised and evaluated.']];
  return [['Purpose', objective],['Essential context','Present the source-supported background the reader needs.'],['Main content',`Develop the required sections in a clear, logical order.${visualNote}`],['Conclusion or action','Close with the intended response, decision or next step.']];
}

export default function Home() {
  const [mode, setMode] = useState<'quick' | 'advanced'>('quick');
  const [step, setStep] = useState(0);
  const [screen, setScreen] = useState<'brief' | 'review' | 'draft'>('brief');
  const [advancedType, setAdvancedType] = useState<AdvancedDocumentType>('presentation');
  const [purpose, setPurpose] = useState('');
  const [audience, setAudience] = useState('Executive leadership');
  const [outcome, setOutcome] = useState('');
  const [advancedTone, setAdvancedTone] = useState('Professional and engaging');
  const [visuals, setVisuals] = useState<VisualPreference>('yes');
  const [advancedExportFormat, setAdvancedExportFormat] = useState<ExportFormat>('pptx');
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [knowledgeNotes, setKnowledgeNotes] = useState('');
  const [newReq, setNewReq] = useState('');
  const [generating, setGenerating] = useState(false);
  const [advancedResult, setAdvancedResult] = useState<AdvancedDocument|null>(null);
  const [advancedUsage, setAdvancedUsage] = useState<GenerationUsage|null>(null);
  const [advancedNotice, setAdvancedNotice] = useState('');
  const [advancedError, setAdvancedError] = useState('');
  const [quickType, setQuickType] = useState<QuickDocumentType>('appreciation');
  const [recipient, setRecipient] = useState('');
  const [appreciation, setAppreciation] = useState('');
  const [quickSecondary, setQuickSecondary] = useState('');
  const [sender, setSender] = useState('');
  const [quickTone, setQuickTone] = useState(quickDocuments.appreciation.tones[0]);
  const [quickFont, setQuickFont] = useState<DocumentFont>('source-sans');
  const [quickTheme, setQuickTheme] = useState<DocumentTheme>('minimal');
  const [documentColours, setDocumentColours] = useState<DocumentColours>({ body:documentThemes.minimal.text, heading:documentThemes.minimal.accent, subheading:documentThemes.minimal.accent });
  const [headerStyle, setHeaderStyle] = useState<DocumentHeaderStyle>('executive');
  const [subheaderStyle, setSubheaderStyle] = useState<DocumentSubheaderStyle>('balanced');
  const [quickGenerated, setQuickGenerated] = useState(false);
  const [jobPost, setJobPost] = useState<JobPostDetails>({ qualifications: '', preferredQualifications: '', benefits: '', application: '', companyUrl: '' });

  const quickConfig = quickDocuments[quickType];
  const title = mode === 'quick' ? (quickGenerated ? `Your ${quickConfig.label.toLowerCase()}` : quickConfig.heading) : screen === 'draft' ? advancedDocumentLabels[advancedType] : screen === 'review' ? `Review your ${advancedDocumentLabels[advancedType].toLowerCase()}` : 'Build your document brief';
  const description = mode === 'quick' ? (quickGenerated ? `Review, edit or export your ${quickConfig.noun}.` : quickConfig.description) : screen === 'draft' ? 'Version 1 is ready for human review.' : screen === 'review' ? 'Confirm what DocBeans will use before generation.' : 'Upload trusted knowledge, define what the content should achieve, and choose how the finished document should be delivered.';

  const changeQuickType = (value: QuickDocumentType) => {
    setQuickType(value); setRecipient(''); setAppreciation(''); setQuickSecondary('');
    setJobPost({ qualifications: '', preferredQualifications: '', benefits: '', application: '', companyUrl: '' });
    setQuickTone(quickDocuments[value].tones[0]); setQuickGenerated(false);
  };

  const changeDocumentTheme = (value:DocumentTheme) => {
    const preset = documentThemes[value];
    setQuickTheme(value);
    setDocumentColours({ body:preset.text, heading:preset.accent, subheading:preset.accent });
  };

  const changeAdvancedType = (value:AdvancedDocumentType) => {
    setAdvancedType(value);
    setAdvancedExportFormat(value === 'presentation' ? 'pptx' : 'docx');
    setVisuals(value === 'presentation' ? 'yes' : visuals);
  };

  const addRequirement = () => {
    const text = newReq.trim();
    if (!text) return;
    setRequirements((items) => [...items, { id: Date.now(), text, mandatory: true }]);
    setNewReq('');
  };

  const generate = async () => {
    setGenerating(true); setAdvancedError(''); setAdvancedNotice('');
    try {
      const settings=loadAiSettings();
      if(settings.credentialMode==='byok'&&!settings.apiKey.trim()) throw new Error('Add your provider API key in AI settings before developing this document.');
      const response=await fetch('/api/generate-advanced',{method:'POST',headers:{'Content-Type':'application/json','X-DocBeans-Billing-Mode':settings.credentialMode,...(settings.credentialMode==='byok'?{'X-Provider-API-Key':settings.apiKey}:{})},body:JSON.stringify({documentType:advancedType,purpose,audience,outcome,tone:advancedTone,visuals,requirements:requirements.map(item=>item.text),knowledgeNotes,sources:sources.filter(source=>source.status==='Ready').map(({name,mimeType,kind,content,dataUrl})=>({name,mimeType,kind,content,dataUrl})),provider:settings.provider,model:settings.model})});
      const payload=await response.json() as AdvancedGenerationResponse&{error?:string};
      if(!response.ok||!payload.document) throw new Error(payload.error||'DocBeans could not develop this document.');
      setAdvancedResult(payload.document); setAdvancedUsage(payload.usage); setAdvancedNotice(payload.notice||''); setScreen('draft');
    } catch(error) { setAdvancedError(error instanceof Error?error.message:'DocBeans could not develop this document.'); }
    finally { setGenerating(false); }
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 flex h-16 items-center border-b border-border bg-background/95 px-4 backdrop-blur sm:px-6 xl:px-7">
        <div className="flex w-56 items-center gap-2.5 xl:w-64">
          <BrandLogo />
          <Badge className="ml-1 bg-accent text-[10px] text-accent-foreground">BETA</Badge>
        </div>
        <label className="mx-auto hidden h-9 w-full max-w-sm items-center gap-2 rounded-xl border border-border bg-muted/55 px-3 text-sm text-muted-foreground md:flex"><Search className="size-4" /><input aria-label="Search documents" className="min-w-0 flex-1 bg-transparent outline-none" placeholder="Search documents" /><kbd className="rounded-md border bg-background px-1.5 py-0.5 text-[10px]">⌘ K</kbd></label>
        <div className="ml-auto flex w-56 items-center justify-end gap-1 xl:w-64"><a href="/settings" aria-label="AI settings" className="grid size-9 place-items-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"><Settings className="size-4" /></a><Button aria-label="Help" variant="ghost" size="icon"><CircleHelp /></Button><Button aria-label="Notifications" variant="ghost" size="icon"><Bell /></Button><a href="/portal" aria-label="Open user portal" className="ml-1 grid size-8 place-items-center rounded-full bg-primary text-xs font-semibold text-white">HM</a></div>
      </header>

      <div className="grid min-h-[calc(100vh-64px)] grid-cols-1 lg:grid-cols-[245px_minmax(0,1fr)]">
        <AppSidebar />
        <section className="px-4 py-7 sm:px-8 xl:px-12 xl:py-9"><div className="mx-auto max-w-[1140px]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div><div className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground"><span>Documents</span><span>/</span><span>{mode === 'quick' ? quickConfig.label : screen === 'draft' ? advancedDocumentLabels[advancedType] : 'Advanced brief'}</span></div><h1 className="font-heading text-3xl font-normal tracking-[-0.025em] sm:text-[38px]">{title}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p></div>
            <div className="flex items-center gap-2"><Badge variant="outline" className="h-7 gap-1.5 bg-card px-3 text-muted-foreground"><span className={`size-1.5 rounded-full ${(mode === 'quick' ? quickGenerated : screen === 'draft') ? 'bg-emerald-500' : 'bg-amber-400'}`} /> {mode === 'quick' && quickGenerated ? 'Generated draft' : screen === 'draft' ? 'Draft ready' : 'Draft'}</Badge>{mode === 'quick' && quickGenerated ? <Button variant="outline" className="h-9 bg-card" onClick={() => window.print()}><Download /> Print / Save PDF</Button> : null}</div>
          </div>

          <div className="mt-6 flex items-center gap-2 rounded-lg border border-border bg-card p-1.5 sm:w-fit"><button onClick={() => setMode('quick')} className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${mode === 'quick' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}>Quick document</button><button onClick={() => setMode('advanced')} className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${mode === 'advanced' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}>Advanced brief</button></div>

          {mode === 'quick' && <QuickDocumentScreen documentType={quickType} onTypeChange={changeQuickType} recipient={recipient} setRecipient={setRecipient} details={appreciation} setDetails={setAppreciation} secondary={quickSecondary} setSecondary={setQuickSecondary} sender={sender} setSender={setSender} tone={quickTone} setTone={setQuickTone} font={quickFont} setFont={setQuickFont} theme={quickTheme} setTheme={changeDocumentTheme} colours={documentColours} setColours={setDocumentColours} headerStyle={headerStyle} setHeaderStyle={setHeaderStyle} subheaderStyle={subheaderStyle} setSubheaderStyle={setSubheaderStyle} jobPost={jobPost} setJobPost={setJobPost} generated={quickGenerated} onGenerate={() => setQuickGenerated(true)} onEdit={() => setQuickGenerated(false)} />}
          {mode === 'advanced' && screen === 'brief' && <BriefScreen step={step} documentType={advancedType} setDocumentType={changeAdvancedType} purpose={purpose} setPurpose={setPurpose} audience={audience} setAudience={setAudience} outcome={outcome} setOutcome={setOutcome} tone={advancedTone} setTone={setAdvancedTone} visuals={visuals} setVisuals={setVisuals} requirements={requirements} setRequirements={setRequirements} newReq={newReq} setNewReq={setNewReq} addRequirement={addRequirement} sources={sources} setSources={setSources} knowledgeNotes={knowledgeNotes} setKnowledgeNotes={setKnowledgeNotes} font={quickFont} setFont={setQuickFont} theme={quickTheme} setTheme={changeDocumentTheme} colours={documentColours} setColours={setDocumentColours} headerStyle={headerStyle} setHeaderStyle={setHeaderStyle} subheaderStyle={subheaderStyle} setSubheaderStyle={setSubheaderStyle} exportFormat={advancedExportFormat} setExportFormat={setAdvancedExportFormat} onBack={() => setStep((s) => Math.max(0, s - 1))} onNext={() => step === 3 ? setScreen('review') : setStep((s) => Math.min(3, s + 1))} />}
          {mode === 'advanced' && screen === 'review' && <ReviewScreen documentType={advancedType} purpose={purpose} audience={audience} outcome={outcome} tone={advancedTone} visuals={visuals} requirements={requirements} sources={sources} knowledgeNotes={knowledgeNotes} font={quickFont} theme={quickTheme} exportFormat={advancedExportFormat} generating={generating} error={advancedError} onBack={() => { setScreen('brief'); setStep(3); }} onGenerate={generate} />}
          {mode === 'advanced' && screen === 'draft' && advancedResult && <DraftScreen documentType={advancedType} document={advancedResult} audience={audience} tone={advancedTone} visuals={visuals} exportFormat={advancedExportFormat} font={quickFont} theme={quickTheme} colours={documentColours} requirements={requirements} sources={sources} usage={advancedUsage} notice={advancedNotice} onEditBrief={() => { setScreen('brief'); setStep(0); }} />}

        </div></section>
      </div>
      <SiteFooter />
    </main>
  );
}

function QuickDocumentScreen({ documentType, onTypeChange, recipient, setRecipient, details, setDetails, secondary, setSecondary, sender, setSender, tone, setTone, font, setFont, theme, setTheme, colours, setColours, headerStyle, setHeaderStyle, subheaderStyle, setSubheaderStyle, jobPost, setJobPost, generated, onGenerate, onEdit }: { documentType:QuickDocumentType; onTypeChange:(v:QuickDocumentType)=>void; recipient:string; setRecipient:(v:string)=>void; details:string; setDetails:(v:string)=>void; secondary:string; setSecondary:(v:string)=>void; sender:string; setSender:(v:string)=>void; tone:string; setTone:(v:string)=>void; font:DocumentFont; setFont:(v:DocumentFont)=>void; theme:DocumentTheme; setTheme:(v:DocumentTheme)=>void; colours:DocumentColours; setColours:React.Dispatch<React.SetStateAction<DocumentColours>>; headerStyle:DocumentHeaderStyle; setHeaderStyle:(v:DocumentHeaderStyle)=>void; subheaderStyle:DocumentSubheaderStyle; setSubheaderStyle:(v:DocumentSubheaderStyle)=>void; jobPost:JobPostDetails; setJobPost:React.Dispatch<React.SetStateAction<JobPostDetails>>; generated:boolean; onGenerate:()=>void; onEdit:()=>void }) {
  const config = quickDocuments[documentType];
  const preset = documentThemes[theme];
  const [copied, setCopied] = useState<'linkedin' | 'portal' | null>(null);
  const [jobResult, setJobResult] = useState<GeneratedJobDocument | null>(null);
  const [quickResult, setQuickResult] = useState<GeneratedQuickDocument | null>(null);
  const [usage, setUsage] = useState<GenerationUsage | null>(null);
  const [notice, setNotice] = useState('');
  const [generationError, setGenerationError] = useState('');
  const [exportError, setExportError] = useState('');
  const [exporting, setExporting] = useState<ExportFormat | null>(null);
  const [generatingJob, setGeneratingJob] = useState(false);
  const [editingJob, setEditingJob] = useState(false);
  const previewRef = useRef<HTMLElement | null>(null);
  const isJobPost = documentType === 'job-description';

  const downloadBlob = (blob:Blob, fileName:string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const downloadDocument = async (format:ExportFormat) => {
    if (!previewRef.current) return;
    const baseName = config.label.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'') || 'docbeans-document';
    const text = previewRef.current.innerText.trim();
    const lines = text.split(/\r?\n/).map(line=>line.trim()).filter(Boolean);
    setExporting(format);
    setExportError('');
    try {
      if (format === 'txt') {
        downloadBlob(new Blob([text], { type:'text/plain;charset=utf-8' }), `${baseName}.txt`);
      } else if (format === 'pdf') {
        const { jsPDF } = await import('jspdf');
        const pdf = new jsPDF({ unit:'pt', format:'a4' });
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 54;
        pdf.setFont('helvetica','bold');
        pdf.setFontSize(20);
        pdf.setTextColor(colours.heading);
        pdf.text(config.label, margin, 68);
        pdf.setDrawColor(colours.heading);
        pdf.line(margin, 82, pageWidth - margin, 82);
        pdf.setFont('helvetica','normal');
        pdf.setFontSize(11);
        pdf.setTextColor(colours.body);
        const wrapped = pdf.splitTextToSize(text, pageWidth - margin * 2) as string[];
        let y = 108;
        for (const line of wrapped) {
          if (y > pageHeight - margin) { pdf.addPage(); y = margin; }
          pdf.text(line, margin, y);
          y += 16;
        }
        pdf.save(`${baseName}.pdf`);
      } else if (format === 'docx') {
        const { Document, HeadingLevel, Packer, Paragraph, TextRun } = await import('docx');
        const children = [new Paragraph({ text:config.label, heading:HeadingLevel.TITLE }), ...lines.map((line,index)=>new Paragraph({ children:[new TextRun({ text:line, bold:index === 0 })], spacing:{ after:160 } }))];
        const file = new Document({ sections:[{ properties:{}, children }] });
        downloadBlob(await Packer.toBlob(file), `${baseName}.docx`);
      } else if (format === 'pptx') {
        const PptxGenJS = (await import('pptxgenjs')).default;
        const deck = new PptxGenJS();
        deck.layout = 'LAYOUT_WIDE';
        deck.author = 'DocBeans';
        deck.subject = config.label;
        deck.title = config.label;
        deck.company = 'DocBeans';
        const titleSlide = deck.addSlide();
        titleSlide.background = { color:preset.surface.replace('#','') };
        titleSlide.addShape(deck.ShapeType.rect,{x:0,y:0,w:0.18,h:7.5,fill:{color:colours.heading.replace('#','')},line:{color:colours.heading.replace('#','')}});
        titleSlide.addText(config.label,{x:0.8,y:2.25,w:10.8,h:1,fontFace:'Arial',fontSize:28,bold:true,color:colours.heading.replace('#',''),margin:0});
        titleSlide.addText('Generated with DocBeans',{x:0.82,y:3.35,w:5,h:0.35,fontFace:'Arial',fontSize:11,color:colours.subheading.replace('#',''),margin:0});
        const contentLines = lines.slice(1);
        for (let i=0;i<contentLines.length;i+=8) {
          const slide = deck.addSlide();
          slide.background = { color:preset.surface.replace('#','') };
          slide.addText(config.label,{x:0.65,y:0.42,w:11.8,h:0.4,fontFace:'Arial',fontSize:18,bold:true,color:colours.heading.replace('#',''),margin:0});
          slide.addShape(deck.ShapeType.line,{x:0.65,y:0.95,w:12,h:0,line:{color:preset.border.replace('#',''),width:1}});
          slide.addText(contentLines.slice(i,i+8).map(value=>({text:value,options:{bullet:{indent:18},breakLine:true}})),{x:0.8,y:1.25,w:11.7,h:5.65,fontFace:'Arial',fontSize:17,color:colours.body.replace('#',''),breakLine:true,margin:0.08,paraSpaceAfter:12,valign:'top'});
        }
        await deck.writeFile({ fileName:`${baseName}.pptx` });
      } else {
        const XLSX = await import('xlsx');
        const workbook = XLSX.utils.book_new();
        const rows = [[config.label],[`Generated with DocBeans`],[],['Order','Document content'],...lines.map((line,index)=>[index+1,line])];
        const worksheet = XLSX.utils.aoa_to_sheet(rows);
        worksheet['!cols'] = [{wch:10},{wch:100}];
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Document');
        XLSX.writeFile(workbook, `${baseName}.xlsx`, { compression:true });
      }
    } catch (error) {
      setExportError(error instanceof Error ? `Could not create the ${format.toUpperCase()} file: ${error.message}` : `Could not create the ${format.toUpperCase()} file.`);
    } finally {
      setExporting(null);
    }
  };

  const copyJobPost = async (target:'linkedin'|'portal') => {
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
      const response = await fetch(isJobPost ? '/api/generate' : '/api/generate-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-DocBeans-Billing-Mode':aiSettings.credentialMode, ...(aiSettings.credentialMode === 'byok' && aiSettings.apiKey ? { 'X-Provider-API-Key':aiSettings.apiKey } : {}) },
        body: JSON.stringify(isJobPost ? { provider:aiSettings.provider, model:aiSettings.model, title:recipient, context:secondary, organisation:sender, companyUrl:jobPost.companyUrl, responsibilities:details, qualifications:jobPost.qualifications, preferredQualifications:jobPost.preferredQualifications, benefits:jobPost.benefits, application:jobPost.application, tone } : { provider:aiSettings.provider, model:aiSettings.model, documentType, primary:recipient, details, secondary, sender, tone }),
      });
      const result = await response.json() as (JobGenerationResponse | QuickGenerationResponse) & { error?:string };
      if (!response.ok) throw new Error(result.error || 'DocBeans could not generate this job description.');
      if (isJobPost) setJobResult((result as JobGenerationResponse).document);
      else setQuickResult((result as QuickGenerationResponse).document);
      setUsage(result.usage);
      try {
        const key = 'docbeans-usage-totals';
        const previous = JSON.parse(window.localStorage.getItem(key) || '{}');
        window.localStorage.setItem(key, JSON.stringify({
          generations:(previous.generations || 0) + 1,
          inputTokens:(previous.inputTokens || 0) + result.usage.inputTokens,
          outputTokens:(previous.outputTokens || 0) + result.usage.outputTokens,
          credits:(previous.credits || 0) + result.usage.credits,
          providerCostUsd:(previous.providerCostUsd || 0) + result.usage.providerCostUsd,
          customerChargeSgd:(previous.customerChargeSgd || 0) + result.usage.customerChargeSgd,
        }));
      } catch { /* Usage display remains available for the current generation. */ }
      setNotice(result.notice || '');
      setEditingJob(false);
      onGenerate();
    } catch (error) {
      setGenerationError(error instanceof Error ? error.message : 'DocBeans could not generate this job description.');
    } finally {
      setGeneratingJob(false);
    }
  };

  if (generated) return <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
    <article ref={previewRef} className="rounded-[20px] border border-t-4 px-7 py-9 shadow-[0_16px_50px_rgba(0,0,0,0.06)] transition-colors sm:px-12 sm:py-12" style={{backgroundColor:preset.surface,borderColor:preset.border,borderTopColor:colours.heading}}>
      {isJobPost && jobResult ? <GeneratedJobPreview document={jobResult} setDocument={setJobResult} editing={editingJob} font={font} theme={theme} colours={colours} headerStyle={headerStyle} subheaderStyle={subheaderStyle} /> : quickResult ? <GeneratedQuickPreview document={quickResult} font={font} theme={theme} colours={colours} headerStyle={headerStyle} subheaderStyle={subheaderStyle} /> : <QuickDraft type={documentType} primary={recipient.trim()} details={details.trim()} secondary={secondary.trim()} sender={sender.trim()} font={font} theme={theme} colours={colours} headerStyle={headerStyle} subheaderStyle={subheaderStyle} jobPost={jobPost} />}
    </article>
    <aside className="space-y-4">
      <div className="rounded-[18px] border border-border bg-card p-5"><div className="flex items-center gap-2 text-sm font-semibold"><CheckCircle2 className="size-4" /> {jobResult?.quality.status === 'needs_review' ? 'Needs your review' : 'Draft ready'}</div><dl className="mt-4 space-y-3 text-xs"><div><dt className="text-muted-foreground">Document</dt><dd className="mt-1 font-medium">{config.label}</dd></div><div><dt className="text-muted-foreground">Style</dt><dd className="mt-1 font-medium">{documentFonts[font].label.split(' · ')[0]} · {preset.label}</dd></div><div><dt className="text-muted-foreground">Tone</dt><dd className="mt-1 font-medium">{tone}</dd></div>{jobResult && <div><dt className="text-muted-foreground">Quality score</dt><dd className="mt-1 font-medium">{jobResult.quality.score}/100</dd></div>}</dl><div className="mt-5 grid gap-2"><Button variant="outline" className="w-full" onClick={onEdit}>Edit brief</Button>{jobResult && <Button variant="outline" className="w-full" onClick={() => setEditingJob(value=>!value)}>{editingJob ? 'Finish editing' : 'Edit generated content'}</Button>}</div></div>
      <div className="rounded-[18px] border border-border bg-card p-5"><p className="text-sm font-semibold">Download document</p><p className="mt-2 text-xs leading-5 text-muted-foreground">Create a genuine file in the format needed for editing, presenting or analysis.</p><div className="mt-4 grid grid-cols-2 gap-2">{([['pdf','PDF'],['docx','DOCX'],['pptx','PPTX'],['txt','TXT'],['xlsx','XLSX']] as const).map(([format,label])=><Button key={format} variant={format === 'pdf' ? 'default' : 'outline'} className={`justify-start ${format === 'xlsx' ? 'col-span-2' : ''}`} disabled={exporting !== null} onClick={() => downloadDocument(format)}><Download /> {exporting === format ? 'Creating…' : label}</Button>)}</div><button type="button" className="mt-3 w-full text-center text-xs font-medium text-muted-foreground underline underline-offset-4 hover:text-foreground" onClick={() => window.print()}>Print instead</button>{exportError && <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs leading-5 text-red-800">{exportError}</p>}</div>
      {jobResult && <div className="rounded-[18px] border border-border bg-card p-5"><p className="text-sm font-semibold">Quality checks</p><div className="mt-3 space-y-3">{jobResult.quality.checks.map(check=><div key={check.label} className="flex gap-2.5 text-xs"><span className={`mt-0.5 size-2 shrink-0 rounded-full ${check.status === 'pass' ? 'bg-emerald-500' : 'bg-amber-400'}`} /><div><p className="font-medium">{check.label}</p><p className="mt-0.5 leading-4 text-muted-foreground">{check.message}</p></div></div>)}</div>{jobResult.quality.missingInformation.length > 0 && <div className="mt-4 rounded-lg bg-amber-50 p-3"><p className="text-xs font-semibold text-amber-900">Complete before publishing</p><ul className="mt-2 list-disc space-y-1 pl-4 text-[11px] text-amber-900/80">{jobResult.quality.missingInformation.map(item=><li key={item}>{item}</li>)}</ul></div>}</div>}
      {isJobPost && jobResult && <div className="rounded-[18px] border border-border bg-card p-5"><p className="text-sm font-semibold">{jobResult.quality.status === 'ready' ? 'Ready to publish' : 'Copy after review'}</p><p className="mt-2 text-xs leading-5 text-muted-foreground">Copy clean, plain text formatted for the destination.</p>{jobResult.quality.status === 'needs_review' && <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-[11px] leading-4 text-amber-900">This draft has review items. Copying does not mark it approved.</p>}<div className="mt-4 space-y-2"><Button className="w-full justify-start" onClick={() => copyJobPost('linkedin')}><Copy /> {copied === 'linkedin' ? 'Copied for LinkedIn' : 'Copy for LinkedIn'}</Button><Button variant="outline" className="w-full justify-start" onClick={() => copyJobPost('portal')}><Copy /> {copied === 'portal' ? 'Copied for job portal' : 'Copy for job portal'}</Button></div></div>}
    </aside>
    {usage && <UsageCard usage={usage} notice={notice} />}
  </div>;

  const preparedByLabel = isJobPost ? 'Organisation' : ['quotation', 'proposal', 'project-brief', 'executive-summary', 'curriculum', 'meeting-agenda', 'meeting-minutes', 'sop'].includes(documentType) ? 'Prepared by' : 'From';
  const followUps = isJobPost ? [!secondary.trim() && 'Add location, workplace model and employment type.', !sender.trim() && 'Add the organisation name.', !jobPost.application.trim() && 'Add an application method or closing date.'].filter(Boolean) as string[] : [];

  return <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
    <section className="rounded-[20px] border border-border bg-card shadow-[0_16px_50px_rgba(0,0,0,0.06)]">
      <div className="border-b border-border px-6 py-5 sm:px-8"><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-md bg-primary text-primary-foreground"><Sparkles className="size-4" /></span><div><p className="text-xs font-semibold uppercase tracking-[.12em] text-muted-foreground">Quick document</p><h2 className="text-lg font-normal">Just the relevant details</h2></div></div></div>
      <div className="space-y-6 p-6 sm:p-8">
        <div><label htmlFor="document-type" className="field-label">What do you want to create?</label><div className="relative mt-2"><select id="document-type" className="field-control appearance-none pr-10" value={documentType} onChange={(e)=>onTypeChange(e.target.value as QuickDocumentType)}><optgroup label="People and career"><option value="appreciation">Appreciation letter</option><option value="thank-you">Thank-you email</option><option value="recommendation">Recommendation letter</option><option value="testimonial">Testimonial</option><option value="cover-letter">Cover letter</option><option value="job-description">Job description</option></optgroup><optgroup label="Business and planning"><option value="quotation">Business quotation</option><option value="proposal">Business proposal</option><option value="project-brief">Project brief</option><option value="executive-summary">Executive summary</option><option value="curriculum">Curriculum structure</option><option value="sop">Standard operating procedure</option></optgroup><optgroup label="Communication and meetings"><option value="memo">Internal memo</option><option value="announcement">Announcement</option><option value="meeting-agenda">Meeting agenda</option><option value="meeting-minutes">Meeting minutes</option></optgroup><optgroup label="Leave requests"><option value="leave">Leave request</option><option value="medical-leave">Medical leave request</option></optgroup></select><ChevronDown className="pointer-events-none absolute right-3 top-3 size-4 text-muted-foreground" /></div></div>
        <div><label htmlFor="quick-primary" className="field-label">{config.primaryLabel} <span>*</span></label><input id="quick-primary" className="field-control mt-2" value={recipient} onChange={(e)=>setRecipient(e.target.value)} placeholder={config.primaryPlaceholder} /></div>
        <div><label htmlFor="quick-details" className="field-label">{config.detailLabel} <span>*</span></label><textarea id="quick-details" className="field-control mt-2 min-h-32 resize-none py-3" value={details} onChange={(e)=>setDetails(e.target.value)} placeholder={config.detailPlaceholder} /><p className="field-help">{config.detailHelp}</p></div>
        {config.secondaryLabel && <div><label htmlFor="quick-secondary" className="field-label">{config.secondaryLabel}{isJobPost && <span> *</span>}</label><input id="quick-secondary" className="field-control mt-2" value={secondary} onChange={(e)=>setSecondary(e.target.value)} placeholder={config.secondaryPlaceholder} /></div>}
        {isJobPost && <div className="rounded-xl border border-border bg-[#fafafa] p-4 sm:p-5"><div><p className="text-sm font-semibold">Publish-ready job details</p><p className="mt-1 text-xs text-muted-foreground">DocBeans rewrites these facts; it will not invent missing claims.</p></div><div className="mt-4 space-y-4"><div><label htmlFor="job-qualifications" className="field-label">Required skills and experience <span>*</span></label><textarea id="job-qualifications" className="field-control mt-2 min-h-24 resize-none py-3" value={jobPost.qualifications} onChange={(e)=>setJobPost(value=>({...value,qualifications:e.target.value}))} placeholder="e.g. 5+ years in consulting; practical AI delivery; strong stakeholder communication" /><p className="field-help">Separate requirements with a new line or semicolon.</p></div><div><label htmlFor="job-preferred" className="field-label">Preferred qualifications <span className="font-normal text-muted-foreground">(optional)</span></label><textarea id="job-preferred" className="field-control mt-2 min-h-20 resize-none py-3" value={jobPost.preferredQualifications} onChange={(e)=>setJobPost(value=>({...value,preferredQualifications:e.target.value}))} placeholder="e.g. Cloud certification; experience in learning design" /></div><div className="grid gap-4 md:grid-cols-2"><div><label htmlFor="job-benefits" className="field-label">Why join / benefits <span className="font-normal text-muted-foreground">(optional)</span></label><textarea id="job-benefits" className="field-control mt-2 min-h-20 resize-none py-3" value={jobPost.benefits} onChange={(e)=>setJobPost(value=>({...value,benefits:e.target.value}))} placeholder="e.g. Shape regional AI adoption; learning budget; flexible work" /></div><div><label htmlFor="job-application" className="field-label">How to apply <span className="font-normal text-muted-foreground">(required to publish)</span></label><textarea id="job-application" className="field-control mt-2 min-h-20 resize-none py-3" value={jobPost.application} onChange={(e)=>setJobPost(value=>({...value,application:e.target.value}))} placeholder="e.g. Apply with your CV at careers@example.com by 30 September" /></div></div></div></div>}
        <div className="grid gap-5 md:grid-cols-2"><div><label htmlFor="quick-tone" className="field-label">Tone</label><div className="relative mt-2"><select id="quick-tone" className="field-control appearance-none pr-10" value={tone} onChange={(e)=>setTone(e.target.value)}>{config.tones.map(item=><option key={item}>{item}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-3 size-4 text-muted-foreground" /></div></div><div><label htmlFor="sender" className="field-label">{preparedByLabel} <span className="font-normal text-muted-foreground">({isJobPost ? 'required to publish' : 'optional'})</span></label><input id="sender" className="field-control mt-2" value={sender} onChange={(e)=>setSender(e.target.value)} placeholder={isJobPost ? 'Organisation name' : 'Your name or organisation'} /></div></div>
        {isJobPost && <div><label htmlFor="company-url" className="field-label">Company website <span className="font-normal text-muted-foreground">(optional)</span></label><input id="company-url" type="url" className="field-control mt-2" value={jobPost.companyUrl} onChange={(e)=>setJobPost(value=>({...value,companyUrl:e.target.value}))} placeholder="https://example.com" /><p className="field-help">Shown in the preview and included in LinkedIn and job-portal copy.</p></div>}
        <div className="rounded-xl border border-border bg-[#fafafa] p-4 sm:p-5">
          <div className="flex items-start justify-between gap-4"><div><p className="text-sm font-semibold">Document design</p><p className="mt-1 text-xs text-muted-foreground">Control the generated file without changing the DocBeans interface.</p></div><div className="flex gap-1.5" aria-hidden="true"><span className="size-3 rounded-full border" style={{backgroundColor:colours.heading}} /><span className="size-3 rounded-full border" style={{backgroundColor:colours.subheading}} /><span className="size-3 rounded-full border" style={{backgroundColor:colours.body}} /></div></div>
          <div className="mt-5 grid gap-4 md:grid-cols-2"><div><label htmlFor="quick-theme" className="field-label">Preset theme</label><div className="relative mt-2"><select id="quick-theme" className="field-control appearance-none pr-10" value={theme} onChange={(e)=>setTheme(e.target.value as DocumentTheme)}>{Object.entries(documentThemes).map(([value,item])=><option key={value} value={value}>{item.label} · {item.description}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-3 size-4 text-muted-foreground" /></div></div><div><label htmlFor="quick-font" className="field-label">Document font</label><div className="relative mt-2"><select id="quick-font" className="field-control appearance-none pr-10" value={font} onChange={(e)=>setFont(e.target.value as DocumentFont)}>{Object.entries(documentFonts).map(([value,item])=><option key={value} value={value}>{item.label}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-3 size-4 text-muted-foreground" /></div></div></div>
          <div className="mt-4 grid gap-4 md:grid-cols-2"><div><label htmlFor="header-style" className="field-label">Header layout</label><div className="relative mt-2"><select id="header-style" className="field-control appearance-none pr-10" value={headerStyle} onChange={(e)=>setHeaderStyle(e.target.value as DocumentHeaderStyle)}><option value="executive">Executive band</option><option value="classic">Classic centred</option><option value="minimal">Minimal rule</option></select><ChevronDown className="pointer-events-none absolute right-3 top-3 size-4 text-muted-foreground" /></div></div><div><label htmlFor="subheader-style" className="field-label">Subheader treatment</label><div className="relative mt-2"><select id="subheader-style" className="field-control appearance-none pr-10" value={subheaderStyle} onChange={(e)=>setSubheaderStyle(e.target.value as DocumentSubheaderStyle)}><option value="compact">Compact</option><option value="balanced">Balanced</option><option value="prominent">Prominent</option></select><ChevronDown className="pointer-events-none absolute right-3 top-3 size-4 text-muted-foreground" /></div></div></div>
          <fieldset className="mt-5"><legend className="field-label">Font colours</legend><div className="mt-3 grid gap-3 sm:grid-cols-3">{([['body','Body text'],['heading','Headers'],['subheading','Subheaders']] as const).map(([key,label])=><label key={key} className="flex items-center gap-3 rounded-lg border border-border bg-white px-3 py-2.5 text-xs font-semibold"><input type="color" aria-label={`${label} colour`} className="size-7 cursor-pointer rounded border-0 bg-transparent p-0" value={colours[key]} onChange={(e)=>setColours(current=>({...current,[key]:e.target.value}))} /><span><span className="block">{label}</span><span className="mt-0.5 block font-mono text-[10px] font-normal uppercase text-muted-foreground">{colours[key]}</span></span></label>)}</div></fieldset>
        </div>
        {generationError && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{generationError}</div>}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5"><p className="text-xs text-muted-foreground">Nothing is published automatically. Credits are charged only after a successful live generation.</p><Button className="h-10 gap-2 px-5" disabled={generatingJob || !recipient.trim() || !details.trim() || (isJobPost && (!secondary.trim() || !jobPost.qualifications.trim()))} onClick={handleGenerate}><WandSparkles /> {generatingJob ? 'Writing and checking…' : `Generate ${config.noun}`}</Button></div>
      </div>
    </section>
    <aside className="space-y-4"><div className="rounded-[18px] border border-border bg-card p-5"><p className="text-sm font-semibold">What DocBeans needs</p><div className="mt-4 space-y-3">{config.checklist.map((item,i)=><div key={item} className="flex items-center gap-3 text-xs"><span className="grid size-6 shrink-0 place-items-center rounded-full bg-muted font-semibold">{i+1}</span>{item}</div>)}</div></div>{followUps.length > 0 && <div className="rounded-[18px] border border-amber-200 bg-amber-50 p-5"><p className="text-sm font-semibold text-amber-950">Before you generate</p><ul className="mt-3 list-disc space-y-2 pl-4 text-xs leading-5 text-amber-900/80">{followUps.map(item=><li key={item}>{item}</li>)}</ul></div>}<div className="rounded-[18px] bg-primary p-5 text-primary-foreground"><p className="text-sm font-semibold">Quality first</p><p className="mt-2 text-xs leading-5 text-white/70">DocBeans rewrites the brief, separates requirements and flags anything that still needs human confirmation.</p></div></aside>
  </div>;
}

function toListItems(value:string) {
  return value
    .split(/\r?\n|;|,(?=\s*[A-Za-z])/)
    .map(item => item.replace(/^(?:[-•*]\s+|\d+[.)]\s+)/, '').trim())
    .filter(Boolean);
}

function sentenceCase(value:string) {
  const clean = value.trim().replace(/[.;,]+$/, '');
  return clean ? clean.charAt(0).toUpperCase() + clean.slice(1) : clean;
}

function lowerFirst(value:string) {
  return value ? value.charAt(0).toLowerCase() + value.slice(1) : value;
}

function toResponsibility(value:string) {
  const clean = value.trim().replace(/[.;,]+$/, '');
  if (/^ai initiatives\b/i.test(clean)) return `Lead AI${clean.slice(2)}`;
  if (/^come up with\b/i.test(clean)) return sentenceCase(clean.replace(/^come up with/i, 'develop'));
  if (/^(lead|drive|identify|develop|build|deliver|define|manage|create|design|assess|advise|partner|establish|implement|support|own|translate|coordinate|monitor|evaluate)\b/i.test(clean)) return sentenceCase(clean);
  return `Own ${lowerFirst(clean)}`;
}

function GeneratedJobPreview({ document, setDocument, editing, font, theme, colours, headerStyle, subheaderStyle }: { document:GeneratedJobDocument; setDocument:React.Dispatch<React.SetStateAction<GeneratedJobDocument | null>>; editing:boolean; font:DocumentFont; theme:DocumentTheme; colours:DocumentColours; headerStyle:DocumentHeaderStyle; subheaderStyle:DocumentSubheaderStyle }) {
  const preset = documentThemes[theme];
  const update = (changes:Partial<GeneratedJobDocument>) => setDocument(current => current ? ({
    ...current,
    ...changes,
    quality: {
      ...current.quality,
      status: 'needs_review',
      score: Math.min(current.quality.score, 88),
      checks: [...current.quality.checks.filter(check=>check.label !== 'Human edits'), { label:'Human edits', status:'review', message:'Review the edited content before publishing.' }],
    },
  }) : current);
  const listValue = (items:string[]) => items.join('\n');
  const parseList = (value:string) => value.split(/\r?\n/).map(item=>item.trim()).filter(Boolean);
  const fieldClass = 'w-full rounded-md border border-input bg-white/70 px-3 py-2 text-base leading-6 shadow-sm';

  return <div className="document-preview mx-auto max-w-[720px]" data-subheader-style={subheaderStyle} style={previewStyle(font,colours)}>
    {editing ? <><p className="text-xs font-semibold uppercase tracking-[.14em]" style={{color:colours.subheading}}>Job description</p><input aria-label="Job title" className={`${fieldClass} mt-3 text-2xl`} value={document.title} onChange={e=>update({title:e.target.value})} /><div className="mt-5 h-px" style={{backgroundColor:colours.heading}} /></> : <DocumentHeader label="Job description" title={document.title} font={font} colours={colours} style={headerStyle} />}
    <div className="mt-5 grid gap-3 sm:grid-cols-2">
      {editing ? <input aria-label="Working context" className={fieldClass} value={document.context} onChange={e=>update({context:e.target.value})} /> : <p className="text-sm font-medium">{document.context}</p>}
      {editing ? <input aria-label="Organisation" className={fieldClass} value={document.organisation} onChange={e=>update({organisation:e.target.value})} /> : document.organisation && <p className="text-sm sm:text-right">{document.organisation}</p>}
    </div>
    {(editing || document.companyUrl) && <div className="mt-3 sm:text-right">{editing ? <input aria-label="Company website" type="url" className={fieldClass} value={document.companyUrl} onChange={e=>update({companyUrl:e.target.value})} placeholder="https://example.com" /> : <a href={document.companyUrl} target="_blank" rel="noreferrer" className="text-sm font-medium underline underline-offset-4" style={{color:colours.subheading}}>{document.companyUrl}</a>}</div>}
    <div className="mt-8 space-y-7 text-base leading-7">
      <section><h3 className="font-semibold">About the role</h3>{editing ? <textarea aria-label="About the role" className={`${fieldClass} mt-2 min-h-28`} value={document.aboutRole} onChange={e=>update({aboutRole:e.target.value})} /> : <p className="mt-2">{document.aboutRole}</p>}</section>
      <section><h3 className="font-semibold">Key responsibilities</h3>{editing ? <textarea aria-label="Key responsibilities" className={`${fieldClass} mt-2 min-h-44`} value={listValue(document.responsibilities)} onChange={e=>update({responsibilities:parseList(e.target.value)})} /> : <ul className="mt-2 list-disc space-y-2 pl-5">{document.responsibilities.map(item=><li key={item}>{item}</li>)}</ul>}</section>
      <section><h3 className="font-semibold">Required skills and experience</h3>{editing ? <textarea aria-label="Required skills and experience" className={`${fieldClass} mt-2 min-h-36`} value={listValue(document.requiredQualifications)} onChange={e=>update({requiredQualifications:parseList(e.target.value)})} /> : <ul className="mt-2 list-disc space-y-2 pl-5">{document.requiredQualifications.map(item=><li key={item}>{item}</li>)}</ul>}</section>
      {(editing || document.preferredQualifications.length > 0) && <section><h3 className="font-semibold">Preferred qualifications</h3>{editing ? <textarea aria-label="Preferred qualifications" className={`${fieldClass} mt-2 min-h-24`} value={listValue(document.preferredQualifications)} onChange={e=>update({preferredQualifications:parseList(e.target.value)})} /> : <ul className="mt-2 list-disc space-y-2 pl-5">{document.preferredQualifications.map(item=><li key={item}>{item}</li>)}</ul>}</section>}
      {(editing || document.benefits.length > 0) && <section><h3 className="font-semibold">Why join us</h3>{editing ? <textarea aria-label="Why join us" className={`${fieldClass} mt-2 min-h-24`} value={listValue(document.benefits)} onChange={e=>update({benefits:parseList(e.target.value)})} /> : <ul className="mt-2 list-disc space-y-2 pl-5">{document.benefits.map(item=><li key={item}>{item}</li>)}</ul>}</section>}
      <section><h3 className="font-semibold">How to apply</h3>{editing ? <textarea aria-label="How to apply" className={`${fieldClass} mt-2 min-h-24`} value={document.application} onChange={e=>update({application:e.target.value})} /> : <p className="mt-2">{document.application}</p>}</section>
      <section className="border-t pt-5" style={{borderColor:preset.border}}>{editing ? <textarea aria-label="Inclusive hiring statement" className={`${fieldClass} min-h-20`} value={document.inclusiveStatement} onChange={e=>update({inclusiveStatement:e.target.value})} /> : <p className="text-sm">{document.inclusiveStatement}</p>}</section>
    </div>
  </div>;
}

function UsageCard({ usage, notice }: { usage:GenerationUsage; notice:string }) {
  const live = usage.mode !== 'local-fallback';
  return <section className="xl:col-span-2 rounded-[18px] border border-border bg-card px-5 py-4" aria-label="Generation usage">
    <div className="flex flex-wrap items-center justify-between gap-4"><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-lg bg-muted"><DollarSign className="size-4" /></span><div><p className="text-sm font-semibold">Generation usage</p><p className="mt-0.5 text-xs text-muted-foreground">{live ? `${usage.billingMode === 'byok' ? 'BYOK' : 'DocBeans AI'} · ${usage.mode === 'anthropic' ? 'Anthropic' : 'OpenAI'} · ${usage.model} · ${usage.inputTokens.toLocaleString()} input · ${usage.outputTokens.toLocaleString()} output tokens` : 'Local quality rules · no AI provider call'}</p></div></div><div className="flex flex-wrap gap-7 text-right"><div><p className="text-xs text-muted-foreground">Credits consumed</p><p className="mt-1 text-sm font-semibold">{usage.credits} DocBeans credit{usage.credits === 1 ? '' : 's'}</p></div><div><p className="text-xs text-muted-foreground">Provider cost</p><p className="mt-1 text-sm font-semibold">US${usage.providerCostUsd.toFixed(6)}</p></div><div><p className="text-xs text-muted-foreground">DocBeans charge</p><p className="mt-1 text-sm font-semibold">SGD {usage.customerChargeSgd.toFixed(2)}</p></div></div></div>
    <p className="mt-3 border-t border-border pt-3 text-[11px] leading-4 text-muted-foreground">{notice || `Actual token usage returned by the provider. Cost calculated from the configured ${usage.model} token rates; customer pricing is shown separately.`}</p>
  </section>;
}

function DocumentHeader({ label, title, font, colours, style }: { label:string; title:string; font:DocumentFont; colours:DocumentColours; style:DocumentHeaderStyle }) {
  const alignment = style === 'classic' ? 'text-center' : 'text-left';
  return <header className={`${alignment} ${style === 'executive' ? 'border-l-4 pl-5' : ''}`} style={{borderColor:colours.heading}}><p className="text-xs font-semibold uppercase tracking-[.14em]" style={{color:colours.subheading}}>{label}</p><h2 className={`${style === 'minimal' ? 'mt-2 text-2xl' : 'mt-3 text-3xl'} font-semibold leading-tight`} style={{fontFamily:documentFonts[font].family,color:colours.heading}}>{title}</h2><div className={`${style === 'classic' ? 'mx-auto mt-5 h-1 w-24' : 'mt-5 h-px'}`} style={{backgroundColor:colours.heading}} /></header>;
}

function previewStyle(font:DocumentFont, colours:DocumentColours) {
  return { fontFamily:documentFonts[font].family, color:colours.body, '--doc-heading':colours.heading, '--doc-subheading':colours.subheading } as React.CSSProperties;
}

function GeneratedQuickPreview({ document, font, colours, headerStyle, subheaderStyle }: { document:GeneratedQuickDocument; font:DocumentFont; theme:DocumentTheme; colours:DocumentColours; headerStyle:DocumentHeaderStyle; subheaderStyle:DocumentSubheaderStyle }) {
  return <div className="document-preview mx-auto max-w-[680px]" data-subheader-style={subheaderStyle} style={previewStyle(font,colours)}><DocumentHeader label="DocBeans document" title={document.title} font={font} colours={colours} style={headerStyle} /><div className="mt-8 whitespace-pre-wrap text-base leading-8">{document.body}</div></div>;
}

function QuickDraft({ type, primary, details, secondary, sender, font, theme, colours, headerStyle, subheaderStyle, jobPost }: { type:QuickDocumentType; primary:string; details:string; secondary:string; sender:string; font:DocumentFont; theme:DocumentTheme; colours:DocumentColours; headerStyle:DocumentHeaderStyle; subheaderStyle:DocumentSubheaderStyle; jobPost:JobPostDetails }) {
  const byline = sender || 'Your name';
  const preset = documentThemes[theme];
  const shell = (label:string, title:string, content:React.ReactNode) => <div className="document-preview mx-auto max-w-[680px]" data-subheader-style={subheaderStyle} style={previewStyle(font,colours)}><DocumentHeader label={label} title={title} font={font} colours={colours} style={headerStyle} /><div className="mt-8 space-y-5 text-[15px] leading-7">{content}</div></div>;
  if (type === 'appreciation') return shell('Appreciation letter', 'With sincere appreciation', <><p>Dear {primary},</p><p>I want to express my sincere appreciation for {details}.</p><p>Your contribution has made a meaningful difference and is genuinely valued. Thank you for the care, initiative and professionalism you have shown.</p><p>With appreciation,<br />{byline}</p></>);
  if (type === 'thank-you') return shell('Thank-you email', `Thank you, ${primary}`, <><p>Dear {primary},</p><p>Thank you for {details}.</p><p>Your support made a real difference, and I truly appreciate the time and care you contributed.</p>{secondary && <p>{secondary}</p>}<p>Warm regards,<br />{byline}</p></>);
  if (type === 'recommendation') return shell('Recommendation letter', `Recommendation for ${primary}`, <><p>To whom it may concern,</p><p>I am pleased to recommend {primary}{secondary ? ` for ${secondary}` : ''}.</p><p>{details}</p><p>Based on these strengths and achievements, I recommend {primary} with confidence. I believe they will bring the same commitment, capability and positive impact to their next opportunity.</p><p>Sincerely,<br />{byline}</p></>);
  if (type === 'cover-letter') return shell('Cover letter', `Application for ${primary}`, <><p>Dear {secondary || 'Hiring Manager'},</p><p>I am writing to express my interest in {primary}. The opportunity strongly aligns with my experience and the contribution I am ready to make.</p><p className="whitespace-pre-line">{details}</p><p>I would welcome the opportunity to discuss how my background can support your team’s goals.</p><p>Sincerely,<br />{byline}</p></>);
  if (type === 'quotation') return shell('Business quotation', `Quotation for ${primary}`, <><div className="grid grid-cols-2 gap-4 border-y border-border py-4 text-sm"><div><span className="block text-xs text-muted-foreground">Prepared for</span><strong>{primary}</strong></div><div><span className="block text-xs text-muted-foreground">Prepared by</span><strong>{byline}</strong></div></div><section><h3 className="font-semibold">Scope and pricing</h3><p className="mt-2 whitespace-pre-line">{details}</p></section><section><h3 className="font-semibold">Commercial terms</h3><p className="mt-2">{secondary || 'Pricing and availability are subject to final confirmation. Please contact us to proceed.'}</p></section></>);
  if (type === 'curriculum') return shell('Curriculum structure', primary, <><section><h3 className="font-semibold">Learner profile and outcomes</h3><p className="mt-2 whitespace-pre-line">{details}</p></section><section><h3 className="font-semibold">Recommended structure</h3><ol className="mt-2 list-decimal space-y-2 pl-5"><li>Foundations and shared vocabulary</li><li>Core concepts and guided practice</li><li>Applied scenarios and collaborative work</li><li>Assessment, reflection and next steps</li></ol></section><p><strong>Delivery:</strong> {secondary || 'Duration and module count to be confirmed'}<br /><strong>Prepared by:</strong> {byline}</p></>);
  if (type === 'proposal') return shell('Business proposal', `Proposal for ${primary}`, <><section><h3 className="font-semibold">Opportunity and proposed solution</h3><p className="mt-2 whitespace-pre-line">{details}</p></section><section><h3 className="font-semibold">Expected value</h3><p className="mt-2">The proposed approach is designed to deliver a focused, measurable outcome while keeping implementation practical and accountable.</p></section><section><h3 className="font-semibold">Commercial terms and next step</h3><p className="mt-2">{secondary || 'Confirm the scope and schedule a working session to agree delivery details.'}</p></section><p><strong>Prepared by:</strong> {byline}</p></>);
  if (type === 'project-brief') return shell('Project brief', primary, <><section><h3 className="font-semibold">Purpose and scope</h3><p className="mt-2 whitespace-pre-line">{details}</p></section><section><h3 className="font-semibold">Delivery context</h3><p className="mt-2">{secondary || 'Ownership, timeline and constraints to be confirmed during initiation.'}</p></section><section><h3 className="font-semibold">Success</h3><p className="mt-2">The project will be considered successful when agreed deliverables are completed, adopted and measured against the stated outcomes.</p></section><p><strong>Prepared by:</strong> {byline}</p></>);
  if (type === 'executive-summary') return shell('Executive summary', primary, <><section><h3 className="font-semibold">Key findings</h3><p className="mt-2 whitespace-pre-line">{details}</p></section><section className="rounded-xl bg-muted p-4"><h3 className="font-semibold">Decision or action</h3><p className="mt-2">{secondary || 'Review the findings and confirm the preferred next step.'}</p></section><p><strong>Prepared by:</strong> {byline}</p></>);
  if (type === 'job-description') {
    const responsibilities = toListItems(details).map(toResponsibility);
    const qualifications = toListItems(jobPost.qualifications);
    return shell('Job description', primary, <><p className="text-sm font-medium" style={{color:colours.subheading}}>{secondary || 'Working arrangement to be confirmed'}</p>{sender && <p className="text-sm"><strong>{sender}</strong></p>}<section><h3 className="font-semibold">About the role</h3><p className="mt-2">As our {primary}, you will {lowerFirst(responsibilities[0] || 'lead the role’s core priorities')} while working with stakeholders to turn business needs into practical, measurable outcomes.</p></section><section><h3 className="font-semibold">Key responsibilities</h3><ul className="mt-2 list-disc space-y-2 pl-5">{responsibilities.map(item=><li key={item}>{item}</li>)}</ul></section><section><h3 className="font-semibold">Required skills and experience</h3><ul className="mt-2 list-disc space-y-2 pl-5">{qualifications.map(item=><li key={item}>{sentenceCase(item)}</li>)}</ul></section>{jobPost.benefits && <section><h3 className="font-semibold">Why join us</h3><ul className="mt-2 list-disc space-y-2 pl-5">{toListItems(jobPost.benefits).map(item=><li key={item}>{sentenceCase(item)}</li>)}</ul></section>}<section><h3 className="font-semibold">How to apply</h3><p className="mt-2">{jobPost.application || 'Apply through this job portal with your CV and a short note explaining your interest in the role.'}</p></section><p className="border-t pt-5 text-sm" style={{borderColor:preset.border}}>We welcome applicants from different backgrounds who can demonstrate the skills and outcomes required for this role.</p></>);
  }
  if (type === 'memo') return shell('Internal memo', `Memo to ${primary}`, <><p><strong>From:</strong> {byline}</p><section><h3 className="font-semibold">Purpose</h3><p className="mt-2 whitespace-pre-line">{details}</p></section>{secondary && <section><h3 className="font-semibold">Action and timing</h3><p className="mt-2">{secondary}</p></section>}</>);
  if (type === 'announcement') return shell('Announcement', 'Important update', <><p>To {primary},</p><p className="whitespace-pre-line">{details}</p>{secondary && <p><strong>Next step:</strong> {secondary}</p>}<p>Thank you,<br />{byline}</p></>);
  if (type === 'meeting-agenda') return shell('Meeting agenda', primary, <><p><strong>Session details:</strong> {secondary || 'To be confirmed'}</p><section><h3 className="font-semibold">Purpose and desired outcomes</h3><p className="mt-2 whitespace-pre-line">{details}</p></section><section><h3 className="font-semibold">Agenda</h3><ol className="mt-2 list-decimal space-y-2 pl-5"><li>Welcome and objective</li><li>Key discussion topics</li><li>Decisions required</li><li>Actions, owners and next steps</li></ol></section></>);
  if (type === 'meeting-minutes') return shell('Meeting minutes', primary, <><p><strong>Attendees:</strong> {secondary || 'Not recorded'}</p><section><h3 className="font-semibold">Discussion and decisions</h3><p className="mt-2 whitespace-pre-line">{details}</p></section><section><h3 className="font-semibold">Actions</h3><p className="mt-2">Confirm each action owner and due date before circulation.</p></section></>);
  if (type === 'sop') return shell('Standard operating procedure', primary, <><p><strong>Owner and references:</strong> {secondary || 'To be assigned'}</p><section><h3 className="font-semibold">Purpose</h3><p className="mt-2">This procedure defines the consistent method for completing {primary}.</p></section><section><h3 className="font-semibold">Procedure</h3><p className="mt-2 whitespace-pre-line">{details}</p></section><section><h3 className="font-semibold">Control</h3><p className="mt-2">Record completion, escalate exceptions and review this procedure when the process changes.</p></section></>);
  if (type === 'leave') return shell('Leave request', 'Request for leave', <><p>Dear {primary},</p><p>I am writing to request leave as follows:</p><p className="whitespace-pre-line">{details}</p>{secondary && <p><strong>Reason:</strong> {secondary}</p>}<p>I will ensure that priority work is handed over and that relevant colleagues have the information they need before my leave.</p><p>Thank you for considering my request.<br /><br />Kind regards,<br />{byline}</p></>);
  if (type === 'medical-leave') return shell('Medical leave request', 'Medical leave notification', <><p>Dear {primary},</p><p>I am writing to request medical leave. {details}</p>{secondary && <p>{secondary}</p>}<p>I will share any required documentation through the appropriate channel and have highlighted urgent handover items to minimise disruption.</p><p>Thank you for your understanding.<br /><br />Kind regards,<br />{byline}</p></>);
  return shell('Testimonial', `Testimonial for ${primary}`, <><blockquote className="border-l-2 border-primary pl-5 text-lg leading-8">“{details}”</blockquote>{secondary && <p className="text-sm text-muted-foreground">Prepared for: {secondary}</p>}<p className="font-medium">— {byline}</p></>);
}

function AppSidebar() {
  return <aside className="hidden flex-col border-r border-border bg-white px-3 py-5 lg:flex"><a href="/create" className="inline-flex h-10 items-center justify-start gap-2.5 rounded-xl bg-primary px-3 text-sm font-semibold text-white"><Plus /> New document</a><nav aria-label="Workspace" className="mt-5 space-y-1"><a className="nav-link nav-link-active" href="/create"><FileText /> Documents</a><a className="nav-link" href="/portal"><Users /> User portal</a><a className="nav-link" href="/settings"><Settings /> AI settings</a></nav><div className="mt-7 px-3 text-[11px] font-semibold uppercase tracking-[0.13em] text-muted-foreground">Recent</div><div className="mt-2 space-y-1"><button className="recent-item"><span className="recent-dot bg-[#16888b]" />Q3 transformation brief</button><button className="recent-item"><span className="recent-dot bg-[#f26b4f]" />Vendor assessment</button><button className="recent-item"><span className="recent-dot bg-[#123f55]" />Launch communication</button></div><div className="mt-auto rounded-xl border border-border bg-white p-3"><p className="text-[11px] font-semibold text-foreground">DocBeans workspace</p><div className="mt-2 flex items-center gap-2 text-[10px] text-muted-foreground"><ShieldCheck className="size-3" /> Protected knowledge</div></div></aside>;
}

type BriefProps = {
  step: number; documentType: AdvancedDocumentType; setDocumentType: (v: AdvancedDocumentType) => void;
  purpose: string; setPurpose: (v: string) => void;
  audience: string; setAudience: (v: string) => void; outcome: string; setOutcome: (v: string) => void;
  tone: string; setTone: (v: string) => void; visuals: VisualPreference; setVisuals: (v: VisualPreference) => void;
  requirements: Requirement[]; setRequirements: React.Dispatch<React.SetStateAction<Requirement[]>>;
  newReq: string; setNewReq: (v: string) => void; addRequirement: () => void;
  sources: Source[]; setSources: React.Dispatch<React.SetStateAction<Source[]>>;
  knowledgeNotes: string; setKnowledgeNotes: (v: string) => void;
  font: DocumentFont; setFont: (v: DocumentFont) => void; theme: DocumentTheme; setTheme: (v: DocumentTheme) => void;
  colours: DocumentColours; setColours: React.Dispatch<React.SetStateAction<DocumentColours>>;
  headerStyle: DocumentHeaderStyle; setHeaderStyle: (v: DocumentHeaderStyle) => void;
  subheaderStyle: DocumentSubheaderStyle; setSubheaderStyle: (v: DocumentSubheaderStyle) => void;
  exportFormat: ExportFormat; setExportFormat: (v: ExportFormat) => void;
  onBack: () => void; onNext: () => void;
};

function BriefScreen(props: BriefProps) {
  const meta = stepMeta[props.step]; const Icon = meta.icon;
  const knowledgeMissing = props.step === 1 && !props.sources.some(source=>source.status==='Ready') && !props.knowledgeNotes.trim();
  const goalMissing = props.step === 0 && !props.purpose.trim();
  const requirementsMissing = props.step === 2 && props.requirements.length === 0;
  return <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]"><div className="overflow-hidden rounded-[22px] border border-border bg-card shadow-[0_16px_50px_rgba(39,70,54,0.07)]"><div className="border-b border-border bg-[#fafafa] px-6 py-5 sm:px-8"><div className="flex items-center justify-between gap-4"><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="size-4" /></span><div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">Step {props.step + 1} of 4</p><h2 className="text-lg font-semibold tracking-tight">{['Define the content goal', 'Upload knowledge content', 'Shape the content', 'Choose the output'][props.step]}</h2></div></div><span className="text-xs font-medium text-muted-foreground">{(props.step + 1) * 25}% complete</span></div><div className="mt-5 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(props.step + 1) * 25}%` }} /></div></div>
    <div className="p-6 sm:p-8">{props.step === 0 && <PurposeStep documentType={props.documentType} setDocumentType={props.setDocumentType} purpose={props.purpose} setPurpose={props.setPurpose} audience={props.audience} setAudience={props.setAudience} outcome={props.outcome} setOutcome={props.setOutcome} tone={props.tone} setTone={props.setTone} visuals={props.visuals} setVisuals={props.setVisuals} />}{props.step === 1 && <KnowledgeStep sources={props.sources} setSources={props.setSources} knowledgeNotes={props.knowledgeNotes} setKnowledgeNotes={props.setKnowledgeNotes} />}{props.step === 2 && <RequirementsStep requirements={props.requirements} setRequirements={props.setRequirements} newReq={props.newReq} setNewReq={props.setNewReq} addRequirement={props.addRequirement} />}{props.step === 3 && <OutputStep font={props.font} setFont={props.setFont} theme={props.theme} setTheme={props.setTheme} colours={props.colours} setColours={props.setColours} headerStyle={props.headerStyle} setHeaderStyle={props.setHeaderStyle} subheaderStyle={props.subheaderStyle} setSubheaderStyle={props.setSubheaderStyle} exportFormat={props.exportFormat} setExportFormat={props.setExportFormat} />}
      <div className="mt-7 flex items-center justify-between border-t border-border pt-5"><Button type="button" variant="ghost" disabled={props.step === 0} onClick={props.onBack}><ArrowLeft /> Back</Button><div className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex"><CheckCircle2 className="size-3.5 text-primary" /> Changes saved</div><Button type="button" className="h-10 gap-2 px-4" disabled={goalMissing || knowledgeMissing || requirementsMissing} onClick={props.onNext}>{props.step === 3 ? 'Review brief' : `Continue to ${stepMeta[props.step + 1]?.name.toLowerCase()}`} <ArrowRight /></Button></div>
    </div></div><GroundingCard /></div>;
}

function PurposeStep({ documentType, setDocumentType, purpose, setPurpose, audience, setAudience, outcome, setOutcome, tone, setTone, visuals, setVisuals }: { documentType:AdvancedDocumentType; setDocumentType:(v:AdvancedDocumentType)=>void; purpose:string; setPurpose:(v:string)=>void; audience:string; setAudience:(v:string)=>void; outcome:string; setOutcome:(v:string)=>void; tone:string; setTone:(v:string)=>void; visuals:VisualPreference; setVisuals:(v:VisualPreference)=>void }) {
  return <div className="space-y-6">
    <div><label htmlFor="advanced-document-type" className="field-label">What do you want to create? <span>*</span></label><div className="relative mt-2"><select id="advanced-document-type" className="field-control appearance-none pr-10" value={documentType} onChange={(e)=>setDocumentType(e.target.value as AdvancedDocumentType)}>{Object.entries(advancedDocumentLabels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-3 size-4 text-muted-foreground" /></div></div>
    <div><label htmlFor="purpose" className="field-label">What should the {advancedDocumentLabels[documentType].toLowerCase()} communicate or achieve? <span>*</span></label><textarea id="purpose" className="field-control mt-2 min-h-24 resize-none py-3" value={purpose} onChange={(e)=>setPurpose(e.target.value)} placeholder={documentType === 'presentation' ? 'e.g. Present the business case, evidence and recommended next steps…' : 'Describe the subject, purpose and main message…'} /></div>
    <div className="grid gap-5 md:grid-cols-2"><div><label htmlFor="audience" className="field-label">Target audience <span>*</span></label><div className="relative mt-2"><select id="audience" className="field-control appearance-none pr-10" value={audience} onChange={(e)=>setAudience(e.target.value)}>{audienceOptions.map(item=><option key={item}>{item}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-3 size-4 text-muted-foreground" /></div></div><div><label htmlFor="advanced-tone" className="field-label">Tone</label><div className="relative mt-2"><select id="advanced-tone" className="field-control appearance-none pr-10" value={tone} onChange={(e)=>setTone(e.target.value)}>{advancedToneOptions.map(item=><option key={item}>{item}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-3 size-4 text-muted-foreground" /></div></div></div>
    <div><label htmlFor="outcome" className="field-label">Desired response or next step</label><input id="outcome" className="field-control mt-2" value={outcome} onChange={(e)=>setOutcome(e.target.value)} placeholder="e.g. Approve the proposal, understand the findings, or take action" /></div>
    <fieldset><legend className="field-label">Should DocBeans create supporting visuals?</legend><div className="mt-3 grid gap-3 sm:grid-cols-2"><Choice active={visuals === 'yes'} title="Yes, create visuals" text="Build source-supported charts, diagrams, comparisons or use supplied images" onClick={()=>setVisuals('yes')} /><Choice active={visuals === 'no'} title="No, text only" text="Keep the output focused on written content" onClick={()=>setVisuals('no')} /></div></fieldset>
    <InfoBox icon={Sparkles} title="Content fit">DocBeans will structure the output as a {advancedDocumentLabels[documentType].toLowerCase()}, not as training material unless you select it.</InfoBox>
  </div>;
}

function RequirementsStep({ requirements, setRequirements, newReq, setNewReq, addRequirement }: { requirements:Requirement[]; setRequirements:React.Dispatch<React.SetStateAction<Requirement[]>>; newReq:string; setNewReq:(v:string)=>void; addRequirement:()=>void }) {
  return <div><div className="flex items-end justify-between gap-4"><div><h3 className="field-label">Trackable requirements <span>*</span></h3><p className="field-help">Every mandatory item receives a visible disposition in the draft.</p></div><Badge variant="secondary">{requirements.length} items</Badge></div><div className="mt-5 space-y-2">{requirements.map((req, i)=><div key={req.id} className="group flex items-start gap-3 rounded-xl border border-border bg-[#fafafa] p-3.5"><span className="grid size-7 shrink-0 place-items-center rounded-lg bg-primary/10 text-[11px] font-semibold text-primary">{i+1}</span><p className="flex-1 pt-1 text-sm leading-5">{req.text}</p><button aria-label={`Delete ${req.text}`} onClick={()=>setRequirements(items=>items.filter(r=>r.id!==req.id))} className="mt-0.5 rounded-md p-1 text-muted-foreground opacity-50 transition hover:bg-red-50 hover:text-destructive group-hover:opacity-100"><Trash2 className="size-3.5" /></button><button onClick={()=>setRequirements(items=>items.map(r=>r.id===req.id?{...r,mandatory:!r.mandatory}:r))} className={`mt-0.5 rounded-full px-2 py-1 text-[10px] font-semibold ${req.mandatory?'bg-[#ececea] text-primary':'bg-muted text-muted-foreground'}`}>{req.mandatory?'Must':'Optional'}</button></div>)}</div><div className="mt-3 flex gap-2"><input aria-label="New requirement" className="field-control" placeholder="Add another requirement…" value={newReq} onChange={(e)=>setNewReq(e.target.value)} onKeyDown={(e)=>{if(e.key==='Enter'){e.preventDefault();addRequirement();}}} /><Button aria-label="Add requirement" variant="outline" size="icon-lg" onClick={addRequirement}><Plus /></Button></div><InfoBox icon={ClipboardCheck} title="Coverage promise" className="mt-6">Silent omission is not allowed. DocBeans will show each requirement as addressed or requiring human review.</InfoBox></div>;
}

function OutputStep({ font, setFont, theme, setTheme, colours, setColours, headerStyle, setHeaderStyle, subheaderStyle, setSubheaderStyle, exportFormat, setExportFormat }: { font:DocumentFont; setFont:(v:DocumentFont)=>void; theme:DocumentTheme; setTheme:(v:DocumentTheme)=>void; colours:DocumentColours; setColours:React.Dispatch<React.SetStateAction<DocumentColours>>; headerStyle:DocumentHeaderStyle; setHeaderStyle:(v:DocumentHeaderStyle)=>void; subheaderStyle:DocumentSubheaderStyle; setSubheaderStyle:(v:DocumentSubheaderStyle)=>void; exportFormat:ExportFormat; setExportFormat:(v:ExportFormat)=>void }) {
  return <div className="space-y-6">
    <div><label htmlFor="advanced-download-type" className="field-label">Download type <span>*</span></label><div className="relative mt-2"><select id="advanced-download-type" className="field-control appearance-none pr-10" value={exportFormat} onChange={(e)=>setExportFormat(e.target.value as ExportFormat)}><option value="pptx">PowerPoint (.pptx)</option><option value="pdf">PDF (.pdf)</option><option value="docx">Word (.docx)</option><option value="txt">Plain text (.txt)</option><option value="xlsx">Excel (.xlsx)</option></select><ChevronDown className="pointer-events-none absolute right-3 top-3 size-4 text-muted-foreground" /></div></div>
    <div className="rounded-xl border border-border bg-[#fafafa] p-4 sm:p-5"><div className="flex items-start justify-between gap-4"><div><p className="text-sm font-semibold">Document design</p><p className="mt-1 text-xs text-muted-foreground">Apply the same professional controls available in Quick Document.</p></div><div className="flex gap-1.5" aria-hidden="true"><span className="size-3 rounded-full border" style={{backgroundColor:colours.heading}} /><span className="size-3 rounded-full border" style={{backgroundColor:colours.subheading}} /><span className="size-3 rounded-full border" style={{backgroundColor:colours.body}} /></div></div>
      <div className="mt-5 grid gap-4 md:grid-cols-2"><div><label htmlFor="advanced-theme" className="field-label">Preset theme</label><div className="relative mt-2"><select id="advanced-theme" className="field-control appearance-none pr-10" value={theme} onChange={(e)=>setTheme(e.target.value as DocumentTheme)}>{Object.entries(documentThemes).map(([value,item])=><option key={value} value={value}>{item.label} · {item.description}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-3 size-4 text-muted-foreground" /></div></div><div><label htmlFor="advanced-font" className="field-label">Document font</label><div className="relative mt-2"><select id="advanced-font" className="field-control appearance-none pr-10" value={font} onChange={(e)=>setFont(e.target.value as DocumentFont)}>{Object.entries(documentFonts).map(([value,item])=><option key={value} value={value}>{item.label}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-3 size-4 text-muted-foreground" /></div></div></div>
      <div className="mt-4 grid gap-4 md:grid-cols-2"><div><label htmlFor="advanced-header-style" className="field-label">Header layout</label><select id="advanced-header-style" className="field-control mt-2" value={headerStyle} onChange={(e)=>setHeaderStyle(e.target.value as DocumentHeaderStyle)}><option value="executive">Executive band</option><option value="classic">Classic centred</option><option value="minimal">Minimal rule</option></select></div><div><label htmlFor="advanced-subheader-style" className="field-label">Subheader treatment</label><select id="advanced-subheader-style" className="field-control mt-2" value={subheaderStyle} onChange={(e)=>setSubheaderStyle(e.target.value as DocumentSubheaderStyle)}><option value="compact">Compact</option><option value="balanced">Balanced</option><option value="prominent">Prominent</option></select></div></div>
      <fieldset className="mt-5"><legend className="field-label">Font colours</legend><div className="mt-3 grid gap-3 sm:grid-cols-3">{([['body','Body text'],['heading','Headers'],['subheading','Subheaders']] as const).map(([key,label])=><label key={key} className="flex items-center gap-3 rounded-lg border border-border bg-white px-3 py-2.5 text-xs font-semibold"><input type="color" aria-label={`${label} colour`} className="size-7 cursor-pointer rounded border-0 bg-transparent p-0" value={colours[key]} onChange={(e)=>setColours(current=>({...current,[key]:e.target.value}))} /><span><span className="block">{label}</span><span className="mt-0.5 block font-mono text-[10px] font-normal uppercase text-muted-foreground">{colours[key]}</span></span></label>)}</div></fieldset>
    </div>
    <InfoBox icon={ShieldCheck} title="Format check">The generated structure must match the selected document type. Presentation downloads contain developed slides and editable evidence visuals, never visual suggestion placeholders.</InfoBox>
  </div>;
}

function KnowledgeStep({ sources, setSources, knowledgeNotes, setKnowledgeNotes }: { sources:Source[]; setSources:React.Dispatch<React.SetStateAction<Source[]>>; knowledgeNotes:string; setKnowledgeNotes:(v:string)=>void }) {
  const addFile = async (file?: File) => {
    if (!file) return;
    const id=Date.now()+Math.floor(Math.random()*1000), size=`${Math.max(1,Math.round(file.size/1024))} KB`;
    setSources(items=>[...items,{id,name:file.name,meta:`${size} · Reading content…`,status:'Checking',mimeType:file.type,kind:'text',content:''}]);
    try {
      const extracted=await extractKnowledgeFile(file);
      if(!extracted.content.trim()&&!extracted.dataUrl) throw new Error('No readable content was found.');
      setSources(items=>items.map(source=>source.id===id?{...source,...extracted,meta:`${size} · ${extracted.kind==='image'?'Image ready for AI analysis':`${extracted.content.length.toLocaleString()} characters extracted`}`,status:'Ready'}:source));
    } catch(error) {
      setSources(items=>items.map(source=>source.id===id?{...source,meta:error instanceof Error?error.message:'The file could not be read.',status:'Error'}:source));
    }
  };
  const readyCount=sources.filter(source=>source.status==='Ready').length;
  return <div className="space-y-6"><div><p className="field-label">Grounding mode <span>*</span></p><div className="mt-3 grid gap-3 sm:grid-cols-3"><Choice active title="Approved sources only" text="Highest evidence control" /><Choice title="Sources + assumptions" text="Clearly mark assumptions" /><Choice title="General knowledge" text="Broader model context" /></div></div><div><div className="flex items-center justify-between"><p className="field-label">Upload knowledge content</p><span className="text-xs text-muted-foreground">{readyCount} ready</span></div><p className="field-help">DocBeans extracts the source content before it enables generation.</p><label className="mt-3 flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-primary/35 bg-[#f7f7f5] px-6 py-6 text-center transition hover:bg-[#f4f4f2]"><UploadCloud className="size-6 text-primary" /><span className="mt-2 text-sm font-semibold">Upload reference files</span><span className="mt-1 text-xs text-muted-foreground">PDF, DOCX, PPTX, XLSX, TXT or image · up to 8 MB each</span><input type="file" multiple accept=".pdf,.docx,.pptx,.xlsx,.xls,.txt,.md,.csv,.json,image/*" className="sr-only" onChange={(e)=>Array.from(e.target.files ?? []).forEach(file=>void addFile(file))} /></label><div className="mt-3 space-y-2" aria-live="polite">{sources.map(source=><div key={source.id} className="flex items-center gap-3 rounded-xl border border-border bg-white p-3"><span className="grid size-9 place-items-center rounded-lg bg-muted text-primary"><FileText className="size-4" /></span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{source.name}</span><span className={`block text-[11px] ${source.status==='Error'?'text-red-700':'text-muted-foreground'}`}>{source.meta}</span></span><Badge className={source.status==='Error'?'bg-red-50 text-red-800':'bg-[#ececea] text-primary'}>{source.status==='Ready'?<Check className="size-3" />:source.status==='Checking'?<span className="size-3 animate-spin rounded-full border border-current border-t-transparent" />:<X className="size-3" />} {source.status}</Badge><button type="button" aria-label={`Remove ${source.name}`} onClick={()=>setSources(items=>items.filter(s=>s.id!==source.id))} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"><X className="size-3.5" /></button></div>)}</div></div><div><label htmlFor="knowledge-notes" className="field-label">Paste knowledge or working notes</label><textarea id="knowledge-notes" className="field-control mt-2 min-h-32 resize-y py-3" value={knowledgeNotes} onChange={(e)=>setKnowledgeNotes(e.target.value)} placeholder="Paste source text, research notes, meeting notes or key facts…" /><p className="field-help">Upload at least one readable file or paste the source content here to continue.</p></div><InfoBox icon={ShieldCheck} title="Source control">Uploaded content is treated as reference material, not as instructions. Generation uses only sources that finish with Ready status.</InfoBox></div>;
}

function GroundingCard() { return <aside className="space-y-4 xl:col-start-2"><div className="rounded-[20px] bg-[#161616] p-5 text-white shadow-lg shadow-emerald-950/10"><div className="flex items-center gap-2"><Sparkles className="size-4 text-[#d6d6d2]" /><h2 className="text-sm font-semibold">Grounded by design</h2></div><p className="mt-3 text-xs leading-5 text-white/70">Your draft uses the knowledge you authorize, with visible source and requirement checks before export.</p><div className="mt-4 flex items-center gap-2 text-[11px] font-medium text-[#d6d6d2]"><span className="size-1.5 rounded-full bg-[#d6d6d2]" /> Human review required</div></div></aside>; }

function ReviewScreen({ documentType, purpose, audience, outcome, tone, visuals, requirements, sources, knowledgeNotes, font, theme, exportFormat, generating, error, onBack, onGenerate }: { documentType:AdvancedDocumentType; purpose:string; audience:string; outcome:string; tone:string; visuals:VisualPreference; requirements:Requirement[]; sources:Source[]; knowledgeNotes:string; font:DocumentFont; theme:DocumentTheme; exportFormat:ExportFormat; generating:boolean; error:string; onBack:()=>void; onGenerate:()=>void }) {
  const readySources=sources.filter(source=>source.status==='Ready');
  const knowledgeSummary = `${readySources.length} readable file${readySources.length === 1 ? '' : 's'}${knowledgeNotes.trim() ? ' + pasted notes' : ''}`;
  const rows = [['Document', advancedDocumentLabels[documentType]],['Content goal', purpose],['Audience', audience],['Tone',tone],['Visuals',visuals === 'yes' ? 'Create supporting visuals' : 'Text only'],['Knowledge',knowledgeSummary],['Download',exportFormat.toUpperCase()],['Design',`${documentThemes[theme].label} · ${documentFonts[font].label.split(' · ')[0]}`],['Desired response', outcome || 'No specific action requested'],['Grounding','Approved sources only']];
  return <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]"><section className="rounded-[22px] border border-border bg-card shadow-[0_16px_50px_rgba(39,70,54,0.07)]"><div className="flex items-center justify-between border-b border-border px-6 py-5 sm:px-8"><div><p className="text-xs font-semibold uppercase tracking-[.12em] text-primary">Interpreted brief</p><h2 className="mt-1 text-lg font-semibold">Ready for your confirmation</h2></div><Badge className="bg-[#ececea] text-primary"><CheckCircle2 /> Complete</Badge></div><div className="p-6 sm:p-8"><div className="grid gap-x-8 gap-y-5 md:grid-cols-2">{rows.map(([label,value])=><div key={label}><p className="text-[11px] font-semibold uppercase tracking-[.1em] text-muted-foreground">{label}</p><p className="mt-1.5 text-sm leading-5">{value}</p></div>)}</div><div className="mt-7 border-t border-border pt-6"><div className="flex items-center justify-between"><h3 className="text-sm font-semibold">Content requirements</h3><span className="text-xs text-primary">{requirements.length} of {requirements.length} valid</span></div><div className="mt-3 space-y-2">{requirements.map(req=><div key={req.id} className="flex gap-2 rounded-lg bg-muted/55 px-3 py-2.5 text-sm"><Check className="mt-0.5 size-3.5 shrink-0 text-primary" /><span>{req.text}</span></div>)}</div></div><div className="mt-6 grid gap-3 sm:grid-cols-3"><ReviewStat icon={FileText} value={`${readySources.length + (knowledgeNotes.trim() ? 1 : 0)}`} label="Knowledge inputs" /><ReviewStat icon={ClipboardCheck} value="0" label="Conflicts" /><ReviewStat icon={ShieldCheck} value="Pass" label="Policy check" /></div><InfoBox icon={Sparkles} title="Development approach" className="mt-6">DocBeans sends the readable knowledge and brief to your selected AI provider, validates the returned structure and only then unlocks review and download.</InfoBox>{error&&<p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-800">{error}</p>}<div className="mt-7 flex items-center justify-between border-t border-border pt-5"><Button variant="ghost" onClick={onBack}><ArrowLeft /> Edit brief</Button><Button className="h-11 gap-2 px-5" onClick={onGenerate} disabled={generating}>{generating ? <><span className="size-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" /> Developing with AI…</> : <><WandSparkles /> Develop document</>}</Button></div></div></section><aside className="space-y-4"><div className="rounded-[20px] border border-border bg-card p-5"><h3 className="text-sm font-semibold">Pre-generation checks</h3><div className="mt-4 space-y-3">{['Four-step brief complete','Knowledge content extracted','AI provider selected','Structured response required','Placeholder content blocked'].map(item=><div key={item} className="flex items-center gap-2.5 text-xs"><span className="grid size-5 place-items-center rounded-full bg-[#ececea] text-primary"><Check className="size-3" /></span>{item}</div>)}</div></div><div className="rounded-[20px] bg-[#161616] p-5 text-white"><Sparkles className="size-5 text-[#d6d6d2]" /><h3 className="mt-3 text-sm font-semibold">What happens next</h3><p className="mt-2 text-xs leading-5 text-white/70">DocBeans develops substantive content and editable visuals, validates the result, then holds it for your review. A failed or placeholder response cannot be downloaded.</p></div></aside></div>;
}

function DraftScreen({ documentType, document, audience, tone, visuals, exportFormat, font, theme, colours, requirements, sources, usage, notice, onEditBrief }: { documentType:AdvancedDocumentType; document:AdvancedDocument; audience:string; tone:string; visuals:VisualPreference; exportFormat:ExportFormat; font:DocumentFont; theme:DocumentTheme; colours:DocumentColours; requirements:Requirement[]; sources:Source[]; usage:GenerationUsage|null; notice:string; onEditBrief:()=>void }) {
  const [tab,setTab]=useState<'document'|'coverage'|'sources'>('document');
  const [exporting,setExporting]=useState(false);
  const [exportError,setExportError]=useState('');
  const preset = documentThemes[theme];
  const title = document.title;
  const baseName = advancedDocumentLabels[documentType].toLowerCase().replace(/[^a-z0-9]+/g,'-') || 'docbeans-document';
  const sectionText=(section:AdvancedSection)=>[section.title,section.summary,...section.bullets.map(item=>`• ${item}`)].join('\n');
  const text = [title,document.subtitle,`For ${audience}`,`Tone: ${tone}`,'',...document.sections.flatMap(section=>[sectionText(section),'']),document.sourcesUsed.length?'Sources used:':'',...document.sourcesUsed].filter(Boolean).join('\n').trim();

  const saveBlob = (blob:Blob,fileName:string) => {
    const url=URL.createObjectURL(blob); const link=globalThis.document.createElement('a');
    link.href=url; link.download=fileName; globalThis.document.body.appendChild(link); link.click(); link.remove();
    window.setTimeout(()=>URL.revokeObjectURL(url),1000);
  };

  const downloadAdvancedDocument = async () => {
    setExporting(true); setExportError('');
    try {
      if(exportFormat==='txt') saveBlob(new Blob([text],{type:'text/plain;charset=utf-8'}),`${baseName}.txt`);
      else if(exportFormat==='pdf') {
        const {jsPDF}=await import('jspdf'); const pdf=new jsPDF({unit:'pt',format:'a4'}); const width=pdf.internal.pageSize.getWidth(); const height=pdf.internal.pageSize.getHeight(); const margin=54;
        pdf.setFont('helvetica','bold'); pdf.setFontSize(20); pdf.setTextColor(colours.heading); pdf.text(advancedDocumentLabels[documentType],margin,64);
        pdf.setFont('helvetica','normal'); pdf.setFontSize(11); pdf.setTextColor(colours.body); let y=94;
        for(const line of pdf.splitTextToSize(text,width-margin*2) as string[]){if(y>height-margin){pdf.addPage();y=margin;}pdf.text(line,margin,y);y+=16;}
        pdf.save(`${baseName}.pdf`);
      } else if(exportFormat==='docx') {
        const {Document,HeadingLevel,Packer,Paragraph,TextRun}=await import('docx');
        const children=[new Paragraph({text:title,heading:HeadingLevel.TITLE}),new Paragraph({text:document.subtitle,heading:HeadingLevel.SUBTITLE}),new Paragraph({children:[new TextRun({text:`For ${audience} · ${tone}`,italics:true})]}),...document.sections.flatMap(section=>[new Paragraph({text:section.title,heading:HeadingLevel.HEADING_1}),new Paragraph({text:section.summary}),...section.bullets.map(item=>new Paragraph({text:item,bullet:{level:0}}))]),...(document.sourcesUsed.length?[new Paragraph({text:'Sources used',heading:HeadingLevel.HEADING_1}),...document.sourcesUsed.map(name=>new Paragraph({text:name,bullet:{level:0}}))]:[])];
        saveBlob(await Packer.toBlob(new Document({sections:[{properties:{},children}]})),`${baseName}.docx`);
      } else if(exportFormat==='pptx') {
        const PptxGenJS=(await import('pptxgenjs')).default; const deck=new PptxGenJS(); const fontFace=font==='georgia'?'Georgia':font==='times'?'Times New Roman':font==='montserrat'?'Montserrat':'Arial';
        deck.layout='LAYOUT_WIDE'; deck.author='DocBeans'; deck.title=title; deck.subject=advancedDocumentLabels[documentType];
        const opening=deck.addSlide(); opening.background={color:preset.surface.replace('#','')}; opening.addShape(deck.ShapeType.rect,{x:0,y:0,w:0.16,h:7.5,fill:{color:colours.heading.replace('#','')},line:{color:colours.heading.replace('#','')}}); opening.addText(title,{x:0.9,y:1.9,w:11.4,h:1.15,fontFace,fontSize:30,bold:true,color:colours.heading.replace('#',''),margin:0,breakLine:false,fit:'shrink'}); opening.addText(document.subtitle,{x:0.92,y:3.15,w:10.5,h:0.75,fontFace,fontSize:18,color:colours.body.replace('#',''),margin:0,fit:'shrink'}); opening.addText(`Prepared for ${audience}`,{x:0.92,y:4.15,w:7,h:0.35,fontFace,fontSize:11,color:colours.subheading.replace('#',''),margin:0});
        for(const [index,section] of document.sections.entries()){
          const slide=deck.addSlide(); const hasVisual=visuals==='yes'&&section.visual.type!=='none'; const textWidth=hasVisual?7.2:11.45;
          slide.background={color:preset.surface.replace('#','')}; slide.addText(section.title,{x:0.75,y:0.42,w:11.85,h:0.62,fontFace,fontSize:24,bold:true,color:colours.heading.replace('#',''),margin:0,fit:'shrink'}); slide.addShape(deck.ShapeType.line,{x:0.75,y:1.13,w:11.85,h:0,line:{color:preset.border.replace('#',''),width:1}});
          slide.addText(section.summary,{x:0.82,y:1.42,w:textWidth,h:1.05,fontFace,fontSize:17,bold:true,color:colours.body.replace('#',''),margin:0.03,breakLine:false,fit:'shrink'});
          if(section.bullets.length)slide.addText(section.bullets.map(item=>({text:item,options:{bullet:{indent:16},hanging:4,breakLine:true}})),{x:0.86,y:2.65,w:textWidth,h:3.65,fontFace,fontSize:16,color:colours.body.replace('#',''),margin:0.04,breakLine:false,paraSpaceAfterPt:12,valign:'top',fit:'shrink'});
          if(hasVisual){const visual=section.visual,x=8.55,y=1.48,w=4.05,h=4.75;slide.addShape(deck.ShapeType.roundRect,{x,y,w,h,fill:{color:preset.soft.replace('#','')},line:{color:preset.border.replace('#',''),width:1}});slide.addText(visual.title||section.title,{x:x+.25,y:y+.2,w:w-.5,h:.45,fontFace,fontSize:14,bold:true,color:colours.subheading.replace('#',''),margin:0,fit:'shrink'});
            if(visual.type==='chart'&&visual.labels.length===visual.values.length&&visual.labels.length>1)slide.addChart(deck.ChartType.bar,[{name:visual.title||'Source data',labels:visual.labels,values:visual.values}],{x:x+.3,y:y+.9,w:w-.6,h:3.2,showLegend:false,showTitle:false,showValue:true,catAxisLabelFontFace:fontFace,catAxisLabelFontSize:10,valAxisLabelFontFace:fontFace,valAxisLabelFontSize:9,chartColors:[colours.heading.replace('#','')],showCatName:false,showValAxisTitle:false,showCatAxisTitle:false});
            else if(visual.type==='source-image'&&sources.find(source=>source.kind==='image'&&source.dataUrl))slide.addImage({data:sources.find(source=>source.kind==='image'&&source.dataUrl)!.dataUrl!,x:x+.3,y:y+.85,w:w-.6,h:3.45});
            else {const labels=visual.labels.length?visual.labels.slice(0,4):visual.description.split(/[,;]|\bthen\b/i).map(item=>item.trim()).filter(Boolean).slice(0,4);const boxH=Math.min(.72,2.8/Math.max(1,labels.length));labels.forEach((label,itemIndex)=>{const boxY=y+.88+itemIndex*(boxH+.18);slide.addShape(deck.ShapeType.roundRect,{x:x+.35,y:boxY,w:w-.7,h:boxH,fill:{color:'FFFFFF'},line:{color:preset.border.replace('#','')}});slide.addText(label,{x:x+.55,y:boxY+.08,w:w-1.1,h:boxH-.16,fontFace,fontSize:12,color:colours.body.replace('#',''),align:'center',valign:'mid',margin:0,fit:'shrink'});});}
          }
          slide.addText(`${index+1}  ·  ${document.sourcesUsed.join(', ')||'Prepared from the supplied brief'}`,{x:.82,y:7.05,w:11.75,h:.2,fontFace,fontSize:8,color:'777777',margin:0,fit:'shrink'});
        }
        await deck.writeFile({fileName:`${baseName}.pptx`});
      } else {
        const XLSX=await import('xlsx'); const workbook=XLSX.utils.book_new(); const rows=[['Document',advancedDocumentLabels[documentType]],['Title',title],['Subtitle',document.subtitle],['Audience',audience],['Tone',tone],[],['Section','Summary','Key points'],...document.sections.map(section=>[section.title,section.summary,section.bullets.join('\n')])]; const worksheet=XLSX.utils.aoa_to_sheet(rows); worksheet['!cols']=[{wch:28},{wch:70},{wch:80}]; XLSX.utils.book_append_sheet(workbook,worksheet,'Document'); const sourceSheet=XLSX.utils.aoa_to_sheet([['Sources used'],...document.sourcesUsed.map(name=>[name])]);XLSX.utils.book_append_sheet(workbook,sourceSheet,'Sources'); const coverage=XLSX.utils.aoa_to_sheet([['Requirement','Status','Evidence'],...document.requirementCoverage.map(item=>[item.requirement,item.status,item.evidence])]);XLSX.utils.book_append_sheet(workbook,coverage,'Coverage');XLSX.writeFile(workbook,`${baseName}.xlsx`,{compression:true});
      }
    } catch(error) { setExportError(error instanceof Error?`Could not create the ${exportFormat.toUpperCase()} file: ${error.message}`:`Could not create the ${exportFormat.toUpperCase()} file.`); }
    finally { setExporting(false); }
  };
  return <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_310px]">
    <section className="overflow-hidden rounded-[22px] border border-border bg-card shadow-[0_16px_50px_rgba(39,70,54,0.07)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-[#fafafa] px-5 py-3"><div className="flex gap-1">{(['document','coverage','sources'] as const).map(item=><button type="button" key={item} onClick={()=>setTab(item)} className={`rounded-lg px-3 py-2 text-xs font-semibold capitalize ${tab===item?'bg-white text-primary shadow-sm':'text-muted-foreground hover:text-foreground'}`}>{item}</button>)}</div><Button size="sm" variant="outline" onClick={onEditBrief}>Edit brief</Button></div>
      {tab==='document'&&<article className="mx-auto max-w-[800px] px-7 py-10 sm:px-12" style={{...previewStyle(font,colours),backgroundColor:preset.surface,borderColor:preset.border}}><DocumentHeader label={advancedDocumentLabels[documentType]} title={document.title} font={font} colours={colours} style="executive" /><p className="mt-3 text-base leading-7" style={{color:colours.subheading}}>{document.subtitle}</p><p className="mt-3 text-sm" style={{color:colours.subheading}}>For {audience} · {tone}</p><div className="mt-9 space-y-9">{document.sections.map((section,index)=><section key={`${section.title}-${index}`}><div className="flex items-start gap-3"><span className="mt-1 grid size-7 shrink-0 place-items-center rounded-md text-xs font-semibold text-white" style={{backgroundColor:colours.heading}}>{index+1}</span><div className="min-w-0 flex-1"><h3 className="text-xl font-semibold tracking-tight" style={{color:colours.subheading}}>{section.title}</h3><p className="mt-2 text-base leading-7" style={{color:colours.body}}>{section.summary}</p>{section.bullets.length>0&&<ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6" style={{color:colours.body}}>{section.bullets.map(item=><li key={item}>{item}</li>)}</ul>}{section.visual.type!=='none'&&<AdvancedVisualPreview section={section} source={sources.find(source=>source.kind==='image'&&source.dataUrl)} colours={colours} preset={preset} />}</div></div></section>)}</div></article>}
      {tab==='coverage'&&<div className="p-6 sm:p-8"><h2 className="text-lg font-semibold">Requirement coverage</h2><p className="mt-1 text-sm text-muted-foreground">The provider linked each requirement to evidence in the developed content.</p><div className="mt-5 space-y-3">{(document.requirementCoverage.length?document.requirementCoverage:requirements.map(req=>({requirement:req.text,status:'review' as const,evidence:'Confirm during human review.'}))).map(item=><div key={item.requirement} className="rounded-xl border border-border p-4"><div className="flex items-start gap-3"><span className="grid size-6 place-items-center rounded-full bg-[#ececea] text-primary"><Check className="size-3.5" /></span><div className="flex-1"><p className="text-sm font-medium">{item.requirement}</p><p className="mt-2 text-xs leading-5 text-muted-foreground">{item.evidence}</p></div><Badge className={item.status==='addressed'?'bg-[#ececea] text-primary':'bg-amber-50 text-amber-800'}>{item.status==='addressed'?'Addressed':'Review'}</Badge></div></div>)}</div></div>}
      {tab==='sources'&&<div className="p-6 sm:p-8"><h2 className="text-lg font-semibold">Knowledge trace</h2><p className="mt-1 text-sm text-muted-foreground">These sources were supplied to the AI provider and retained in the generated response.</p><div className="mt-5 space-y-3">{sources.filter(source=>source.status==='Ready').map(source=><div key={source.id} className="flex items-center gap-3 rounded-xl border border-border p-4"><FileText className="size-4 text-primary" /><div className="flex-1"><p className="text-sm font-medium">{source.name}</p><p className="mt-1 text-xs text-muted-foreground">{source.meta}</p></div><Badge variant="outline">{document.sourcesUsed.includes(source.name)?'Used':'Supplied'}</Badge></div>)}</div></div>}
    </section>
    <aside className="space-y-4"><div className="rounded-[20px] border border-border bg-card p-5"><div className="flex items-center justify-between gap-3"><h3 className="text-sm font-semibold">Output settings</h3><Badge className="bg-emerald-50 text-emerald-800"><CheckCircle2 className="size-3" /> Validated</Badge></div><dl className="mt-4 space-y-3 text-xs"><div><dt className="text-muted-foreground">Document</dt><dd className="mt-1 font-medium">{advancedDocumentLabels[documentType]}</dd></div><div><dt className="text-muted-foreground">Download</dt><dd className="mt-1 font-medium">{exportFormat.toUpperCase()}</dd></div><div><dt className="text-muted-foreground">Design</dt><dd className="mt-1 font-medium">{preset.label} · {documentFonts[font].label.split(' · ')[0]}</dd></div><div><dt className="text-muted-foreground">Visuals</dt><dd className="mt-1 font-medium">{document.sections.filter(section=>section.visual.type!=='none').length} developed</dd></div><div><dt className="text-muted-foreground">Quality</dt><dd className="mt-1 font-medium">{document.quality.score}/100 · {document.quality.status==='ready'?'Ready':'Review advised'}</dd></div></dl><Button className="mt-5 w-full" onClick={downloadAdvancedDocument} disabled={exporting}><Download /> {exporting?`Creating ${exportFormat.toUpperCase()}…`:`Download ${exportFormat.toUpperCase()}`}</Button>{exportError&&<p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs leading-5 text-red-800">{exportError}</p>}</div>{usage&&<div className="rounded-[20px] border border-border bg-card p-5"><h3 className="text-sm font-semibold">AI generation</h3><dl className="mt-3 space-y-2 text-xs"><div className="flex justify-between gap-3"><dt className="text-muted-foreground">Model</dt><dd className="text-right font-medium">{usage.model}</dd></div><div className="flex justify-between"><dt className="text-muted-foreground">Tokens</dt><dd className="font-medium">{usage.totalTokens.toLocaleString()}</dd></div><div className="flex justify-between"><dt className="text-muted-foreground">Credits</dt><dd className="font-medium">{usage.credits}</dd></div></dl>{notice&&<p className="mt-3 text-xs leading-5 text-muted-foreground">{notice}</p>}</div>}<div className="rounded-[20px] bg-[#161616] p-5 text-white"><ShieldCheck className="size-4 text-[#d6d6d2]" /><h3 className="mt-3 text-sm font-semibold">Human review required</h3><p className="mt-2 text-xs leading-5 text-white/70">Review facts, claims and visuals in the Document tab. The download was unlocked only after the structured response passed validation.</p></div></aside>
  </div>;
}

function AdvancedVisualPreview({section,source,colours,preset}:{section:AdvancedSection;source?:Source;colours:DocumentColours;preset:(typeof documentThemes)[DocumentTheme]}) {
  const visual=section.visual;
  return <div className="mt-5 rounded-xl border p-4" style={{borderColor:preset.border,backgroundColor:preset.soft}}><p className="text-xs font-semibold uppercase tracking-[.08em]" style={{color:colours.subheading}}>{visual.title||'Supporting visual'}</p>{visual.type==='source-image'&&source?.dataUrl?<img src={source.dataUrl} alt={visual.description||source.name} className="mt-3 max-h-72 w-full rounded-lg bg-white object-contain" />:visual.type==='chart'&&visual.labels.length===visual.values.length?<div className="mt-4 space-y-2">{visual.labels.map((label,index)=>{const max=Math.max(...visual.values,1);return <div key={label} className="grid grid-cols-[120px_1fr_42px] items-center gap-2 text-xs"><span className="truncate">{label}</span><span className="h-3 overflow-hidden rounded-full bg-white"><span className="block h-full rounded-full" style={{width:`${Math.max(4,(visual.values[index]/max)*100)}%`,backgroundColor:colours.heading}} /></span><span className="text-right font-semibold">{visual.values[index]}</span></div>;})}</div>:<div className="mt-3 grid gap-2 sm:grid-cols-2">{(visual.labels.length?visual.labels:visual.description.split(/[,;]|\bthen\b/i)).filter(Boolean).slice(0,6).map(label=><span key={label} className="rounded-lg border bg-white px-3 py-2 text-center text-xs leading-5" style={{borderColor:preset.border,color:colours.body}}>{label}</span>)}</div>}<p className="mt-3 text-xs leading-5" style={{color:colours.body}}>{visual.description}</p></div>;
}

function Choice({ active=false,title,text,onClick }: { active?:boolean;title:string;text:string;onClick?:()=>void }) { return <button type="button" onClick={onClick} className={`rounded-xl border p-3 text-left transition ${active?'border-primary bg-[#f4f4f2] ring-1 ring-primary/15':'border-border bg-white hover:border-primary/40'}`}><span className="flex items-center justify-between"><span className="text-sm font-semibold">{title}</span><span className={`grid size-4 place-items-center rounded-full border ${active?'border-primary bg-primary text-white':'border-input'}`}>{active&&<Check className="size-2.5" />}</span></span><span className="mt-1 block text-[11px] text-muted-foreground">{text}</span></button>; }
function InfoBox({ icon:Icon,title,children,className='' }: { icon:typeof Sparkles;title:string;children:React.ReactNode;className?:string }) { return <div className={`rounded-xl border border-[#dededb] bg-[#f4f4f2] p-4 ${className}`}><div className="flex gap-3"><Icon className="mt-0.5 size-4 shrink-0 text-primary" /><div><p className="text-sm font-semibold">{title}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{children}</p></div></div></div>; }
function ReviewStat({ icon:Icon,value,label }: { icon:typeof FileText;value:string;label:string }) { return <div className="rounded-xl border border-border bg-[#fafafa] p-4"><Icon className="size-4 text-primary" /><div className="mt-2 text-lg font-semibold">{value}</div><div className="text-[11px] text-muted-foreground">{label}</div></div>; }
function QualityBar({label,value}:{label:string;value:number}) { return <div><div className="flex justify-between text-xs"><span className="text-muted-foreground">{label}</span><span className="font-semibold">{value}%</span></div><div className="mt-2 h-1.5 rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{width:`${value}%`}} /></div></div>; }

