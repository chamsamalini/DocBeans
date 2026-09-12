import { BrainCircuit, FileCheck2, KeyRound, LayoutTemplate, Palette, Share2, ShieldCheck, WandSparkles } from 'lucide-react';
import { MarketingPage } from '@/components/marketing-page';

const features=[
  [WandSparkles,'Quick document generation','Create letters, proposals, quotations, curricula, job descriptions, meeting records and other practical documents from focused prompts.'],
  [BrainCircuit,'Choice of AI model','Select Anthropic or OpenAI once in AI settings. The choice applies across every AI-generated document workflow.'],
  [KeyRound,'Bring your own key','Use the managed DocBeans key or your own provider key. BYOK credentials remain session-only in the current browser tab.'],
  [FileCheck2,'Quality checks','Job descriptions receive structure, repetition, unsupported-claim and publication-readiness checks before use.'],
  [Palette,'Professional presentation','Choose an appropriate font and document theme, then print or save the finished document as a PDF.'],
  [Share2,'Destination-ready copy','Prepare clean copy for LinkedIn, job portals and other publishing destinations without publishing automatically.'],
  [LayoutTemplate,'Quick and advanced modes','Use a compact form for everyday documents or a governed brief when requirements and source traceability matter.'],
  [ShieldCheck,'Human review by design','Generated content remains a draft until a person checks names, claims, dates, commitments and sensitive details.'],
] as const;

export default function FeaturesPage(){return <MarketingPage kicker="Product capabilities" title="Useful documents without an oversized workflow." intro="DocBeans combines focused inputs, selectable AI models and visible review controls so people can move from intent to a professional draft quickly."><div className="grid gap-4 md:grid-cols-2">{features.map(([Icon,title,text])=><article className="marketing-card" key={title}><span className="grid size-11 place-items-center rounded-xl bg-secondary text-primary"><Icon className="size-5" /></span><h2 className="mt-5 text-xl tracking-[-.02em]">{title}</h2><p className="mt-3 text-base leading-7 text-muted-foreground">{text}</p></article>)}</div></MarketingPage>}
