import Link from 'next/link';
import { Check, Download, Globe2, KeyRound, ReceiptText, Sparkles } from 'lucide-react';
import { MarketingPage } from '@/components/marketing-page';
import { buttonVariants } from '@/components/ui/button';

export default function PricingPage() {
  return <MarketingPage
    kicker="Simple pricing"
    title="Pay for access, then choose how your AI usage is billed."
    intro="Your DocBeans access fee and AI-generation charges are separate. Choose the web platform or desktop edition, then use DocBeans AI or bring your own provider key."
  >
    <section className="rounded-2xl border border-border bg-card p-6 shadow-[0_14px_38px_rgba(18,63,85,.08)] sm:p-8">
      <div className="flex items-start gap-4"><span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary text-sm font-semibold text-white">1</span><div><p className="text-sm font-semibold uppercase tracking-[.12em] text-[#16888b]">Choose your access</p><h2 className="mt-2 text-2xl">The product fee</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">AI usage is not included in these access prices.</p></div></div>
      <div className="mt-7 grid gap-5 lg:grid-cols-2">
        <article className="rounded-2xl border border-[#16888b] bg-secondary/35 p-6 ring-2 ring-[#16888b]/10">
          <Globe2 className="size-6 text-primary" />
          <h3 className="mt-4 text-xl font-semibold">DocBeans Platform</h3>
          <div className="mt-4 flex items-end gap-2"><span className="text-4xl font-semibold tracking-[-.04em]">USD 7</span><span className="pb-1 text-muted-foreground">per month</span></div>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">Recurring browser access, including all document workflows, themes and product updates.</p>
          <Link href="/create" className={buttonVariants({className:'mt-6 w-full'})}>Use DocBeans online</Link>
        </article>
        <article className="rounded-2xl border border-border p-6">
          <Download className="size-6 text-accent" />
          <h3 className="mt-4 text-xl font-semibold">DocBeans Desktop</h3>
          <div className="mt-4 flex items-end gap-2"><span className="text-4xl font-semibold tracking-[-.04em]">USD 45</span><span className="pb-1 text-muted-foreground">one time</span></div>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">A one-time application charge for the downloadable desktop edition.</p>
          <button type="button" disabled className="mt-6 inline-flex h-9 w-full items-center justify-center rounded-md bg-muted px-4 text-sm font-semibold text-muted-foreground">Desktop download coming soon</button>
        </article>
      </div>
    </section>

    <section className="mt-7 rounded-2xl border border-border bg-card p-6 shadow-[0_14px_38px_rgba(18,63,85,.08)] sm:p-8">
      <div className="flex items-start gap-4"><span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary text-sm font-semibold text-white">2</span><div><p className="text-sm font-semibold uppercase tracking-[.12em] text-[#16888b]">Choose your AI billing</p><h2 className="mt-2 text-2xl">Two ways to pay for generation</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Only the selected billing path applies to each AI-generated document.</p></div></div>
      <div className="mt-7 grid gap-5 lg:grid-cols-2">
        <article className="rounded-2xl border border-border p-6">
          <Sparkles className="size-6 text-accent" />
          <h3 className="mt-4 text-xl font-semibold">Use DocBeans AI</h3>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">DocBeans provides the model access. Managed generation is metered according to the selected model and returned token usage.</p>
          <ul className="mt-5 space-y-3 text-sm"><li className="flex gap-2.5"><Check className="mt-0.5 size-4 shrink-0 text-[#16888b]" />Current beta processing charge: SGD 0.03 and 1 DocBeans credit per successful draft</li><li className="flex gap-2.5"><Check className="mt-0.5 size-4 shrink-0 text-[#16888b]" />Model usage and estimated cost shown after generation</li></ul>
        </article>
        <article className="rounded-2xl border border-border p-6">
          <KeyRound className="size-6 text-primary" />
          <h3 className="mt-4 text-xl font-semibold">Bring your own key</h3>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">Use your Anthropic or OpenAI API key. Your selected provider bills its model usage directly to your provider account.</p>
          <ul className="mt-5 space-y-3 text-sm"><li className="flex gap-2.5"><Check className="mt-0.5 size-4 shrink-0 text-[#16888b]" />No DocBeans AI credit or managed-generation charge</li><li className="flex gap-2.5"><Check className="mt-0.5 size-4 shrink-0 text-[#16888b]" />Provider usage estimate shown after generation</li></ul>
          <Link href="/settings" className={buttonVariants({variant:'outline',className:'mt-6 w-full'})}>Configure BYOK</Link>
        </article>
      </div>
    </section>

    <section className="mt-7 flex gap-4 rounded-2xl border border-border bg-secondary/65 p-5 sm:p-6">
      <ReceiptText className="mt-0.5 size-5 shrink-0 text-primary" />
      <div><h2 className="text-base font-semibold">Taxes</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Prices exclude GST, VAT and sales tax. Applicable tax is calculated according to the customer’s billing country and local tax requirements.</p></div>
    </section>

    <p className="mt-5 text-sm leading-6 text-muted-foreground"><strong className="text-foreground">Beta notice:</strong> Checkout and desktop download delivery are not yet connected. No purchase is taken from this page.</p>
  </MarketingPage>;
}
