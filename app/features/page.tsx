import {
  BookOpenCheck, BrainCircuit, Download, FileCheck2, Files,
  KeyRound, LayoutTemplate, Palette, ReceiptText, Share2, ShieldCheck, UserRoundPen,
  WandSparkles,
} from 'lucide-react';
import { MarketingPage } from '@/components/marketing-page';

const groups = [
  {
    label:'Create',
    title:'Start with the document—not a blank prompt.',
    description:'DocBeans changes the questions and structure to match what you are creating.',
    features:[
      [Files,'Practical document library','Create appreciation and recommendation letters, testimonials, leave requests, job descriptions, quotations, proposals, curricula, meeting records, SOPs and more.'],
      [WandSparkles,'Quick Document','Answer only the focused questions needed for the selected document and move quickly to a usable draft.'],
      [LayoutTemplate,'Advanced Brief','Define role, purpose, requirements, output and approved knowledge when governance and traceability matter.'],
      [UserRoundPen,'Roles, tone and context','Choose a writing role or enter a custom one, then guide vocabulary, audience relationship and professional tone.'],
    ],
  },
  {
    label:'Control AI',
    title:'Choose the model and who pays for it.',
    description:'AI settings apply across the application, while every generation remains visible and accountable.',
    features:[
      [BrainCircuit,'Application-wide model choice','Select Anthropic or OpenAI and the preferred model once for every DocBeans workflow.'],
      [KeyRound,'Managed AI or BYOK','Use DocBeans-managed AI or bring your own provider key. BYOK credentials remain session-only in the current browser tab.'],
      [ReceiptText,'Transparent usage and charges','See returned token usage, estimated provider cost, credits consumed and the DocBeans generation charge after each successful request.'],
      [ShieldCheck,'Safe fallback behavior','If no provider is configured, DocBeans can produce a local-rule draft without provider tokens or AI credits.'],
    ],
  },
  {
    label:'Review and deliver',
    title:'Turn the draft into something ready to use.',
    description:'Presentation, quality checks and destination-aware output stay part of the same workflow.',
    features:[
      [FileCheck2,'Quality and publication checks','Review structure, repetition, unsupported claims, missing details and publication readiness—especially for job descriptions.'],
      [BookOpenCheck,'Human review by design','Generated content remains a draft until a person verifies names, facts, links, dates, prices, commitments and sensitive details.'],
      [Palette,'Professional document styling','Select a document font and preset theme independently from the consistent DocBeans interface style.'],
      [Share2,'Export and destination-ready copy','Edit the draft, print or save it as PDF, and copy clean text for LinkedIn or job portals without automatic publishing.'],
    ],
  },
] as const;

export default function FeaturesPage() {
  return <MarketingPage
    kicker="Product capabilities"
    title="A focused path from intent to a reviewed document."
    intro="DocBeans combines document-specific guidance, flexible AI access, visible quality controls and professional output—without turning a simple writing task into a complex workflow."
  >
    <div className="space-y-12">
      {groups.map(group=><section key={group.label}>
        <div className="grid gap-4 lg:grid-cols-[.75fr_1.25fr] lg:gap-10">
          <div><p className="marketing-kicker">{group.label}</p><h2 className="mt-3 text-3xl leading-tight tracking-[-.035em]">{group.title}</h2><p className="mt-4 text-base leading-7 text-muted-foreground">{group.description}</p></div>
          <div className="grid gap-4 sm:grid-cols-2">{group.features.map(([Icon,title,text])=><article className="marketing-card" key={title}><span className="grid size-11 place-items-center rounded-xl bg-secondary text-primary"><Icon className="size-5" /></span><h3 className="mt-5 text-lg font-semibold tracking-[-.02em]">{title}</h3><p className="mt-3 text-sm leading-6 text-muted-foreground">{text}</p></article>)}</div>
        </div>
      </section>)}
    </div>
    <section className="mt-12 grid gap-5 rounded-2xl bg-primary p-6 text-primary-foreground sm:p-8 md:grid-cols-[1fr_auto] md:items-center">
      <div><div className="flex items-center gap-3"><Download className="size-5 text-[#7bd0cf]" /><h2 className="text-xl">Web today. Desktop next.</h2></div><p className="mt-3 max-w-3xl text-sm leading-6 text-white/70">DocBeans is currently available through the web platform. The USD 45 one-time desktop edition is planned; checkout and installer delivery are not yet connected.</p></div>
      <span className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white/80">Desktop coming soon</span>
    </section>
  </MarketingPage>;
}
