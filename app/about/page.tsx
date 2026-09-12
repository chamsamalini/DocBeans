import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight, Bean, Bell, BookOpen, CheckCircle2, CircleHelp, FileText,
  FolderKanban, LayoutTemplate, LockKeyhole, Search, Settings, ShieldCheck,
  Sparkles, WandSparkles,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { SiteFooter } from '@/components/site-footer';
import { Button, buttonVariants } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'About DocBeans — chams.ai',
  description: 'Learn how DocBeans turns a small amount of clear intent into useful, professional and review-ready documents.',
};

const principles = [
  { icon: WandSparkles, title: 'Simple when it should be', text: 'Quick Document asks only for the details that matter to the document you selected.' },
  { icon: ShieldCheck, title: 'Controlled when it must be', text: 'Advanced Brief adds requirements, approved knowledge, traceability and human review.' },
  { icon: CheckCircle2, title: 'Relevant by design', text: 'Questions, structure, tone and styling adapt to the type of document you are creating.' },
  { icon: LockKeyhole, title: 'Human accountability', text: 'DocBeans creates a draft for review. It does not quietly publish or make decisions for you.' },
];

const documentGroups = [
  ['People & career', 'Appreciation letters, recommendations, testimonials, cover letters and job descriptions'],
  ['Business & planning', 'Proposals, quotations, project briefs, executive summaries and curricula'],
  ['Communication', 'Memos, announcements, meeting agendas and meeting minutes'],
  ['Operations & leave', 'Standard operating procedures, leave requests and medical leave requests'],
];

export default function AboutPage() {
  return <main className="min-h-screen bg-background text-foreground">
    <header className="sticky top-0 z-30 flex h-16 items-center border-b border-border bg-background/95 px-4 backdrop-blur sm:px-6 xl:px-7">
      <Link href="/" className="flex w-56 items-center gap-2.5 xl:w-64" aria-label="DocBeans home">
        <span className="grid size-9 place-items-center rounded-md bg-primary text-primary-foreground shadow-sm"><Bean className="size-5" /></span>
        <span className="flex flex-col leading-none"><span className="font-brand text-[9px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">chams.ai</span><span className="mt-1 text-base font-semibold tracking-[-0.02em]">DocBeans</span></span>
        <Badge className="ml-1 bg-accent text-[10px] text-accent-foreground">BETA</Badge>
      </Link>
      <label className="mx-auto hidden h-9 w-full max-w-sm items-center gap-2 rounded-xl border border-border bg-muted/55 px-3 text-sm text-muted-foreground md:flex"><Search className="size-4" /><input aria-label="Search documents" className="min-w-0 flex-1 bg-transparent outline-none" placeholder="Search documents" /><kbd className="rounded-md border bg-background px-1.5 py-0.5 text-[10px]">⌘ K</kbd></label>
      <div className="ml-auto flex w-56 items-center justify-end gap-1 xl:w-64"><Link href="/settings" aria-label="AI settings" className="grid size-9 place-items-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"><Settings className="size-4" /></Link><Button aria-label="Help" variant="ghost" size="icon"><CircleHelp /></Button><Button aria-label="Notifications" variant="ghost" size="icon"><Bell /></Button><button aria-label="Open profile" className="ml-1 grid size-8 place-items-center rounded-full bg-primary text-xs font-semibold text-white">HM</button></div>
    </header>

    <div className="grid min-h-[calc(100vh-64px)] grid-cols-1 lg:grid-cols-[245px_minmax(0,1fr)]">
      <aside className="hidden flex-col border-r border-border bg-sidebar px-3 py-5 lg:flex"><Link href="/" className={buttonVariants({className:'h-10 justify-start gap-2.5 rounded-xl px-3'})}><FileText /> New document</Link><nav aria-label="Primary" className="mt-5 space-y-1"><Link className="nav-link" href="/"><FileText /> Documents</Link><Link className="nav-link" href="/features"><FolderKanban /> Features</Link><Link className="nav-link" href="/pricing"><LayoutTemplate /> Pricing</Link><Link className="nav-link" href="/manual"><BookOpen /> Manual</Link><Link className="nav-link nav-link-active" href="/about"><CircleHelp /> About DocBeans</Link></nav><div className="mt-auto rounded-xl border border-border bg-white/50 p-3"><p className="text-[11px] font-semibold text-foreground">chams.ai workspace</p><div className="mt-2 flex items-center gap-2 text-[10px] text-muted-foreground"><ShieldCheck className="size-3" /> Protected knowledge</div></div><div className="mt-3 border-t border-border pt-3"><Link className="nav-link" href="/settings"><Settings /> AI settings</Link></div></aside>

      <section className="px-4 py-8 sm:px-8 xl:px-12 xl:py-11"><div className="mx-auto max-w-[1080px]">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground"><Link href="/">DocBeans</Link><span>/</span><span>About</span></div>
        <section className="mt-6 overflow-hidden rounded-[24px] border border-border bg-card shadow-[0_18px_55px_rgba(0,0,0,0.06)]">
          <div className="grid lg:grid-cols-[minmax(0,1fr)_340px]">
            <div className="px-7 py-10 sm:px-11 sm:py-14"><Badge className="bg-accent text-accent-foreground">ABOUT DOCBEANS</Badge><h1 className="mt-5 max-w-3xl font-heading text-4xl font-normal leading-[1.08] tracking-[-0.035em] sm:text-5xl">Better documents start with the right amount of structure.</h1><p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">DocBeans is the document-creation product within chams.ai. It helps people turn clear intent into professional, useful and review-ready documents—without making a simple task feel complicated.</p><div className="mt-8 flex flex-wrap gap-3"><Link href="/" className={buttonVariants({className:'h-11 px-5'})}>Create a document <ArrowRight /></Link><a href="#how-it-works" className="inline-flex h-11 items-center rounded-md border border-border bg-white px-5 text-sm font-semibold transition hover:bg-muted">See how it works</a></div></div>
            <div className="relative grid min-h-72 place-items-center bg-[#171717] p-8 text-white"><div className="absolute inset-x-8 top-8 h-px bg-white/15" /><div className="text-center"><span className="mx-auto grid size-16 place-items-center rounded-2xl bg-white text-[#171717]"><Bean className="size-8" /></span><p className="mt-5 font-brand text-[11px] font-semibold uppercase tracking-[.25em] text-white/55">A chams.ai product</p><p className="mt-2 text-2xl font-semibold">DocBeans</p><p className="mx-auto mt-3 max-w-56 text-sm leading-6 text-white/65">The fast path from an idea to a document worth reviewing.</p></div><div className="absolute inset-x-8 bottom-8 flex items-center justify-between text-[10px] uppercase tracking-[.16em] text-white/40"><span>Grounded</span><span>Relevant</span><span>Human-led</span></div></div>
          </div>
        </section>

        <section id="how-it-works" className="mt-12"><p className="text-xs font-semibold uppercase tracking-[.15em] text-muted-foreground">Two ways to work</p><h2 className="mt-3 text-3xl font-normal tracking-[-.025em]">Simple by default. Rigorous when needed.</h2><div className="mt-6 grid gap-5 md:grid-cols-2"><article className="rounded-[20px] border border-border bg-card p-6 sm:p-7"><span className="grid size-10 place-items-center rounded-lg bg-primary text-primary-foreground"><Sparkles className="size-5" /></span><p className="mt-5 text-xs font-semibold uppercase tracking-[.12em] text-muted-foreground">Quick Document</p><h3 className="mt-2 text-xl font-semibold">For everyday documents</h3><p className="mt-3 text-sm leading-6 text-muted-foreground">Choose a document, answer a few relevant questions, select a tone, font and preset theme, then review the generated draft.</p><ul className="mt-5 space-y-2 text-sm">{['Adaptive questions','Document-aware structure','Professional styling presets'].map(item=><li key={item} className="flex items-center gap-2"><CheckCircle2 className="size-4" />{item}</li>)}</ul></article><article className="rounded-[20px] border border-border bg-[#171717] p-6 text-white sm:p-7"><span className="grid size-10 place-items-center rounded-lg bg-white text-[#171717]"><BookOpen className="size-5" /></span><p className="mt-5 text-xs font-semibold uppercase tracking-[.12em] text-white/45">Advanced Brief</p><h3 className="mt-2 text-xl font-semibold">For governed business documents</h3><p className="mt-3 text-sm leading-6 text-white/65">Define the writing role, purpose, requirements, output and approved knowledge before creating a traceable draft.</p><ul className="mt-5 space-y-2 text-sm">{['Requirement coverage','Approved-source grounding','Review and traceability'].map(item=><li key={item} className="flex items-center gap-2"><CheckCircle2 className="size-4 text-white/80" />{item}</li>)}</ul></article></div></section>

        <section className="mt-12 grid gap-8 lg:grid-cols-[.8fr_1.2fr]"><div><p className="text-xs font-semibold uppercase tracking-[.15em] text-muted-foreground">What it creates</p><h2 className="mt-3 text-3xl font-normal tracking-[-.025em]">Useful across the working day.</h2><p className="mt-4 text-sm leading-6 text-muted-foreground">DocBeans covers common personal and professional documents while keeping each workflow relevant to its purpose.</p></div><div className="grid gap-3 sm:grid-cols-2">{documentGroups.map(([title,text])=><div key={title} className="rounded-2xl border border-border bg-card p-5"><h3 className="text-sm font-semibold">{title}</h3><p className="mt-2 text-xs leading-5 text-muted-foreground">{text}</p></div>)}</div></section>

        <section className="mt-12 rounded-[22px] border border-border bg-card p-7 sm:p-9"><div className="max-w-2xl"><p className="text-xs font-semibold uppercase tracking-[.15em] text-muted-foreground">Product principles</p><h2 className="mt-3 text-3xl font-normal tracking-[-.025em]">Designed around the document—not the technology.</h2></div><div className="mt-7 grid gap-x-7 gap-y-8 sm:grid-cols-2">{principles.map(({icon:Icon,title,text})=><div key={title} className="flex gap-4"><span className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted"><Icon className="size-4" /></span><div><h3 className="text-sm font-semibold">{title}</h3><p className="mt-1.5 text-xs leading-5 text-muted-foreground">{text}</p></div></div>)}</div></section>

        <section className="mt-12 flex flex-col items-start justify-between gap-6 rounded-[22px] bg-[#171717] px-7 py-8 text-white sm:flex-row sm:items-center sm:px-9"><div><p className="font-brand text-[10px] font-semibold uppercase tracking-[.2em] text-white/45">DocBeans by chams.ai</p><h2 className="mt-2 text-2xl font-normal">Start with what you need to say.</h2><p className="mt-2 text-sm text-white/60">DocBeans will help shape it into the right document.</p></div><Link href="/" className={buttonVariants({className:'h-11 shrink-0 bg-white px-5 text-[#171717] hover:bg-[#efefed]'})}>Create a document <ArrowRight /></Link></section>
      </div></section>
    </div>
    <SiteFooter />
  </main>;
}
