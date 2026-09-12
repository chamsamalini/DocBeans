import Link from 'next/link';
import { CheckCircle2, FileText, KeyRound, PenLine, SearchCheck, Settings, UploadCloud } from 'lucide-react';
import { MarketingPage } from '@/components/marketing-page';

const steps=[
  [Settings,'Set the AI provider','Open AI settings, choose Anthropic or OpenAI, select a model, and decide whether to use the managed key or BYOK.'],
  [FileText,'Choose a document','Open Quick document for an everyday draft. Use Advanced brief when you want DocBeans to develop content from your own knowledge and formal requirements.'],
  [PenLine,'Provide the essential facts','Complete the required fields. Add names, dates, outcomes, scope and constraints that the document must preserve.'],
  [UploadCloud,'Add your knowledge content','In Advanced brief, upload reference files or paste working notes, then confirm how strictly DocBeans should stay grounded in them.'],
  [SearchCheck,'Generate and review','Read the complete draft. Resolve quality notes and verify facts, claims, links, prices, dates and sensitive information.'],
  [CheckCircle2,'Edit, download or copy','Edit the generated content, apply its document design, then download PDF, DOCX, PPTX, TXT or XLSX—or copy destination-ready text.'],
] as const;

export default function ManualPage(){return <MarketingPage title="From blank page to reviewed document." intro="Follow this workflow for every document. Nothing is published automatically, and generation never replaces accountable human review."><div className="grid gap-4">{steps.map(([Icon,title,text],index)=><article className="marketing-card grid gap-4 sm:grid-cols-[48px_minmax(0,1fr)]" key={title}><span className="grid size-12 place-items-center rounded-xl bg-primary text-white"><Icon className="size-5" /></span><div><p className="marketing-kicker">Step {index+1}</p><h2 className="mt-1 text-xl">{title}</h2><p className="mt-2 text-base leading-7 text-muted-foreground">{text}</p></div></article>)}</div><section className="mt-8 rounded-2xl border border-border bg-white p-6 sm:p-8"><div className="flex gap-4"><KeyRound className="mt-1 size-6 shrink-0 text-primary"/><div><h2 className="text-xl">BYOK reminder</h2><p className="mt-2 max-w-3xl text-base leading-7 text-muted-foreground">A personal API key is kept only for the current browser-tab session. Closing the tab clears it. Return to <Link className="font-semibold text-primary underline underline-offset-4" href="/settings">AI settings</Link> when starting a new session.</p></div></div></section></MarketingPage>}
