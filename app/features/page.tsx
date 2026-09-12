import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  ArrowRight, BookOpenCheck, BrainCircuit, Check, Download, FileCheck2, Files,
  LockKeyhole, Palette, ShieldCheck, SlidersHorizontal, Sparkles,
  Type, WandSparkles,
} from 'lucide-react';
import { MarketingPage } from '@/components/marketing-page';
import { buttonVariants } from '@/components/ui/button';

const capabilityRows = [
  {
    number:'01',
    label:'Create with context',
    title:'Start from the document you need.',
    text:'Select a practical document type and DocBeans presents only the questions, tone choices and structure relevant to that output.',
    points:['18 focused document workflows','Quick Document and Advanced Brief','Custom roles, audience and approved knowledge'],
    icon:Files,
  },
  {
    number:'02',
    label:'Apply governance',
    title:'Keep AI choice, cost and review visible.',
    text:'Set Anthropic or OpenAI once, choose managed AI or BYOK, and retain a clear view of provider usage, credits and human review requirements.',
    points:['Application-wide model settings','Session-only BYOK credentials','Usage, cost and quality summaries'],
    icon:ShieldCheck,
  },
  {
    number:'03',
    label:'Design the output',
    title:'Control how the document looks and reads.',
    text:'Use an executive document design panel to manage presentation independently from the consistent DocBeans interface.',
    points:['Five professional themes and fonts','Body, header and subheader colours','Header layouts and subheader treatments'],
    icon:SlidersHorizontal,
  },
  {
    number:'04',
    label:'Deliver',
    title:'Move from reviewed draft to a usable file.',
    text:'Generate genuine PDF, DOCX, PPTX, TXT and XLSX files, then copy destination-ready job content without automatic publishing.',
    points:['PDF and editable DOCX output','Presentation-ready PPTX and structured XLSX','Plain text, LinkedIn and job-portal copy'],
    icon:Download,
  },
] as const;

const controls = [
  [Palette,'Theme','Minimal, corporate blue, warm ivory, editorial or formal green'],
  [Type,'Typography','Choose the document font, header layout and subheader emphasis'],
  [SlidersHorizontal,'Colour','Set body, header and subheader font colours independently'],
  [Download,'Output','Generate PDF, DOCX, PPTX, TXT or XLSX files'],
] as const;

const productPrinciples = [
  [Sparkles, 'Simple when it should be', 'Quick Document asks only for the details that matter to the document selected.'],
  [ShieldCheck, 'Controlled when it must be', 'Advanced Brief adds requirements, approved knowledge, traceability and human review.'],
  [FileCheck2, 'Relevant by design', 'Questions, structure, tone and styling adapt to the purpose of each document.'],
  [LockKeyhole, 'Human accountability', 'Every output remains a draft until its facts, commitments and sensitive details are reviewed.'],
] as const;

const latestUpdates = [
  ['Five genuine downloads', 'Export generated work as PDF, DOCX, PPTX, TXT or XLSX.'],
  ['Executive document design', 'Choose the theme, font, text colours, header layout and subheader treatment.'],
  ['Application-wide AI settings', 'Select Anthropic or OpenAI once and use DocBeans-managed access or BYOK.'],
] as const;

export function AboutPage() {
  return <MarketingPage
    kicker="About DocBeans"
    title="Executive document creation, with control at every stage."
    intro="Move from intent to a professional, review-ready document in one governed workspace—without turning a straightforward task into a complicated process."
  >
    <section className="overflow-hidden rounded-[24px] border border-border bg-white shadow-[0_18px_55px_rgba(18,63,85,.08)]">
      <div className="grid lg:grid-cols-[1.2fr_.8fr]">
        <div className="px-7 py-9 sm:px-10 sm:py-12"><p className="marketing-kicker">One document workspace</p><h2 className="mt-4 max-w-2xl text-3xl leading-tight tracking-[-.04em] sm:text-4xl">Create. Govern. Design. Deliver.</h2><p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground">DocBeans combines document-specific guidance, AI governance, executive presentation controls and practical file delivery.</p><div className="mt-8 flex flex-wrap gap-3"><Link href="/login" className={buttonVariants({className:'h-11 gap-2 px-5'})}>Create a document <ArrowRight className="size-4" /></Link><Link href="/pricing" className={buttonVariants({variant:'outline',className:'h-11 px-5'})}>View pricing</Link></div></div>
        <div className="grid grid-cols-2 border-t border-border bg-white lg:border-l lg:border-t-0">{[['18','Document workflows'],['5','Preset themes'],['2','AI providers'],['5','Download formats']].map(([value,label])=><div key={label} className="flex min-h-32 flex-col justify-end border-b border-r border-border p-6 last:border-b-0"><strong className="text-3xl tracking-[-.04em]">{value}</strong><span className="mt-2 text-sm text-muted-foreground">{label}</span></div>)}</div>
      </div>
    </section>

    <section className="mt-16"><div className="flex flex-wrap items-end justify-between gap-5 border-b border-border pb-6"><div><p className="marketing-kicker">Operating model</p><h2 className="mt-3 text-3xl tracking-[-.035em]">A clear path from brief to final file.</h2></div><p className="max-w-md text-sm leading-6 text-muted-foreground">Each stage answers an executive question: what are we creating, how is it governed, how should it appear, and how will it be used?</p></div>
      <div>{capabilityRows.map(({number,label,title,text,points,icon:Icon})=><article key={number} className="grid gap-6 border-b border-border py-9 md:grid-cols-[70px_1fr_1.05fr] md:gap-9"><div className="flex items-center gap-3 md:block"><span className="text-sm font-semibold text-[#16888b]">{number}</span><span className="ml-auto grid size-10 place-items-center rounded-xl bg-secondary text-primary md:ml-0 md:mt-5"><Icon className="size-5" /></span></div><div><p className="text-sm font-semibold uppercase tracking-[.12em] text-muted-foreground">{label}</p><h3 className="mt-3 text-2xl leading-tight tracking-[-.03em]">{title}</h3><p className="mt-4 text-base leading-7 text-muted-foreground">{text}</p></div><ul className="grid content-center gap-3">{points.map(point=><li key={point} className="flex items-start gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm"><span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-secondary text-primary"><Check className="size-3" /></span>{point}</li>)}</ul></article>)}</div>
    </section>

    <section className="mt-16 rounded-[22px] border border-border bg-card p-7 shadow-[0_18px_55px_rgba(18,63,85,.08)] sm:p-9"><div className="grid gap-8 lg:grid-cols-[.8fr_1.2fr]"><div><p className="marketing-kicker">Document design system</p><h2 className="mt-3 text-3xl leading-tight tracking-[-.035em]">Presentation controls belong inside the workflow.</h2><p className="mt-4 text-base leading-7 text-muted-foreground">Choose a coordinated preset, then adjust the details required for your brand, audience or destination.</p><Link href="/login" className={buttonVariants({variant:'outline',className:'mt-6 gap-2'})}>Open document workspace <ArrowRight className="size-4" /></Link></div><div className="grid gap-4 sm:grid-cols-2">{controls.map(([Icon,title,text])=><div key={title} className="rounded-2xl border border-border bg-white p-5"><Icon className="size-5 text-primary" /><h3 className="mt-4 text-base font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p></div>)}</div></div></section>

    <section className="mt-10 grid gap-4 md:grid-cols-3"><article className="marketing-card"><BrainCircuit className="size-5 text-primary" /><h3 className="mt-4 text-lg font-semibold">AI choice</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">Use Anthropic or OpenAI with DocBeans-managed access or your own key.</p></article><article className="marketing-card"><FileCheck2 className="size-5 text-primary" /><h3 className="mt-4 text-lg font-semibold">Review controls</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">Check structure, completeness, unsupported claims and publication readiness.</p></article><article className="marketing-card"><BookOpenCheck className="size-5 text-primary" /><h3 className="mt-4 text-lg font-semibold">Human accountability</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">Every output remains a draft until names, facts, commitments and sensitive details are verified.</p></article></section>

    <section id="about" className="mt-16 scroll-mt-24 border-y border-border py-12"><div className="grid gap-10 lg:grid-cols-[.75fr_1.25fr]"><div><p className="marketing-kicker">About DocBeans</p><h2 className="mt-3 text-3xl leading-tight tracking-[-.035em]">Better documents start with the right amount of structure.</h2><p className="mt-5 text-base leading-7 text-muted-foreground">DocBeans helps people turn clear intent into professional, useful and review-ready documents without making a simple task feel complicated.</p><p className="mt-4 text-sm leading-6 text-muted-foreground">Use Quick Document for everyday work or Advanced Brief when governance, approved knowledge and traceability matter.</p></div><div className="grid gap-4 sm:grid-cols-2">{productPrinciples.map(([Icon,title,text])=><article key={title} className="rounded-2xl border border-border bg-card p-5"><span className="grid size-10 place-items-center rounded-xl bg-secondary text-primary"><Icon className="size-5" /></span><h3 className="mt-4 text-base font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p></article>)}</div></div></section>

    <section id="latest-updates" className="mt-16 scroll-mt-24 rounded-[22px] border border-border bg-white p-7 sm:p-9"><div className="flex flex-wrap items-end justify-between gap-5"><div><p className="marketing-kicker">Latest updates</p><h2 className="mt-3 text-3xl tracking-[-.035em]">What is new in DocBeans.</h2></div><span className="rounded-full border border-border bg-white px-3 py-1.5 text-sm text-muted-foreground">September 2026</span></div><div className="mt-7 grid gap-4 md:grid-cols-3">{latestUpdates.map(([title,text],index)=><article key={title} className="rounded-2xl border border-border bg-card p-5"><span className="text-sm font-semibold text-[#16888b]">0{index + 1}</span><h3 className="mt-4 text-lg font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p></article>)}</div></section>

    <section className="mt-12 flex flex-col items-start justify-between gap-5 rounded-2xl border border-border bg-white p-7 sm:flex-row sm:items-center sm:p-8"><div><div className="flex items-center gap-3"><WandSparkles className="size-5 text-primary" /><h2 className="text-xl">Create the document you need.</h2></div><p className="mt-2 text-sm leading-6 text-muted-foreground">Start with a focused brief, then shape the presentation and download the reviewed result.</p></div><Link href="/login" className={buttonVariants({className:'h-11 shrink-0 gap-2 px-5'})}>Start creating <ArrowRight className="size-4" /></Link></section>
  </MarketingPage>;
}

export default function LegacyFeaturesPage() {
  redirect('/');
}
