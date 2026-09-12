import Link from 'next/link';
import { Check, Download, Globe2, KeyRound, Sparkles } from 'lucide-react';
import { MarketingPage } from '@/components/marketing-page';
import { buttonVariants } from '@/components/ui/button';

const platformFeatures = [
  'Use DocBeans in your web browser',
  'Access all document workflows and themes',
  'Receive ongoing product updates',
];

const desktopFeatures = [
  'Download and install the desktop application',
  'Pay once instead of a monthly platform fee',
  'Use managed AI or your own provider key',
];

export default function PricingPage() {
  return <MarketingPage
    kicker="Simple pricing"
    title="Choose monthly web access or a one-time desktop purchase."
    intro="The platform and desktop editions include the same document-creation experience. AI usage is charged separately and remains visible after generation."
  >
    <div className="grid gap-5 lg:grid-cols-2">
      <article className="marketing-card flex flex-col border-[#16888b] ring-2 ring-[#16888b]/10">
        <span className="grid size-11 place-items-center rounded-xl bg-secondary text-primary"><Globe2 className="size-5" /></span>
        <p className="mt-5 text-sm font-semibold uppercase tracking-[.12em] text-[#16888b]">Web platform</p>
        <h2 className="mt-2 text-2xl">DocBeans Platform</h2>
        <div className="mt-5 flex items-end gap-2"><span className="text-4xl font-semibold tracking-[-.04em]">USD 7</span><span className="pb-1 text-muted-foreground">/ month</span></div>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">A recurring platform fee for browser-based access to DocBeans.</p>
        <ul className="mt-6 space-y-3 text-sm">{platformFeatures.map(item=><li className="flex gap-2.5" key={item}><Check className="mt-0.5 size-4 shrink-0 text-[#16888b]" />{item}</li>)}</ul>
        <Link href="/" className={buttonVariants({className:'mt-7 w-full'})}>Use DocBeans online</Link>
      </article>

      <article className="marketing-card flex flex-col">
        <span className="grid size-11 place-items-center rounded-xl bg-[#fff0ec] text-accent"><Download className="size-5" /></span>
        <p className="mt-5 text-sm font-semibold uppercase tracking-[.12em] text-accent">Desktop download</p>
        <h2 className="mt-2 text-2xl">DocBeans Desktop</h2>
        <div className="mt-5 flex items-end gap-2"><span className="text-4xl font-semibold tracking-[-.04em]">USD 45</span><span className="pb-1 text-muted-foreground">one time</span></div>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">A one-time application charge for the downloadable desktop edition.</p>
        <ul className="mt-6 space-y-3 text-sm">{desktopFeatures.map(item=><li className="flex gap-2.5" key={item}><Check className="mt-0.5 size-4 shrink-0 text-[#16888b]" />{item}</li>)}</ul>
        <button type="button" disabled className="mt-7 inline-flex h-9 w-full items-center justify-center rounded-md bg-muted px-4 text-sm font-semibold text-muted-foreground">Desktop download coming soon</button>
      </article>
    </div>

    <section className="mt-7 rounded-2xl border border-border bg-card p-6 sm:p-8">
      <div className="max-w-2xl"><p className="text-sm font-semibold uppercase tracking-[.12em] text-[#16888b]">Separate AI usage</p><h2 className="mt-2 text-2xl">Know what each generation costs.</h2><p className="mt-3 text-sm leading-6 text-muted-foreground">The platform or desktop price covers access to DocBeans. Model usage is separate because its cost depends on the provider and model you select.</p></div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl bg-secondary/65 p-5"><Sparkles className="size-5 text-accent" /><h3 className="mt-3 text-base font-semibold">Managed AI</h3><p className="mt-2 text-sm leading-6 text-muted-foreground"><strong className="text-foreground">SGD 0.03 and 1 DocBeans credit</strong> per successful draft. Returned token usage and the cost estimate are shown after generation.</p></div>
        <div className="rounded-xl bg-secondary/65 p-5"><KeyRound className="size-5 text-primary" /><h3 className="mt-3 text-base font-semibold">Bring your own key</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">Anthropic or OpenAI bills model usage directly to your provider account. Configure BYOK in <Link className="font-semibold text-primary underline underline-offset-4" href="/settings">AI settings</Link>.</p></div>
      </div>
    </section>

    <p className="mt-5 text-sm leading-6 text-muted-foreground"><strong className="text-foreground">Beta notice:</strong> Checkout and desktop download delivery are not yet connected. No purchase is taken from this page.</p>
  </MarketingPage>;
}
