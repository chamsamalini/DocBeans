import Link from 'next/link';
import { Activity, CreditCard, ShieldCheck, Users } from 'lucide-react';
import { BrandLogo } from '@/components/brand-logo';
import { SiteFooter } from '@/components/site-footer';
import { buttonVariants } from '@/components/ui/button';
import { requireAdministrator } from '@/services/auth/server';
import { getConfiguredAuthProvider } from '@/services/auth/config';

export const dynamic = 'force-dynamic';

export default async function AdminPortalPage() {
  const user = await requireAdministrator();
  const authProvider = getConfiguredAuthProvider();
  const cards = [
    [Users,'Account access',authProvider==='supabase'?'Supabase Auth':'Auth0','Google, Microsoft and verified work-email account creation are supported.'],
    [Activity,'AI providers','2 configured','Anthropic and OpenAI are available through managed AI or BYOK.'],
    [CreditCard,'Billing','Not connected','Subscription checkout, invoices and payment events still require a billing provider.'],
    [ShieldCheck,'Compliance','Policy published','PDPA, GDPR and data-protection commitments are available in the footer.'],
  ] as const;
  return <main className="min-h-screen bg-white text-foreground"><header className="border-b border-border bg-white"><div className="mx-auto flex h-16 max-w-[1180px] items-center gap-4 px-5 sm:px-8"><Link href="/"><BrandLogo /></Link><span className="text-sm text-muted-foreground">Admin portal</span><Link href="/portal" className={buttonVariants({variant:'outline',className:'ml-auto'})}>User portal</Link></div></header><section className="mx-auto max-w-[1080px] px-5 py-12 sm:px-8"><p className="marketing-kicker">Administration</p><h1 className="mt-3 text-4xl tracking-[-.04em]">Product operations.</h1><p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">Signed in as {user.email}. This operational view is protected by both the administrator allowlist and authenticator MFA.</p><div className="mt-9 grid gap-5 sm:grid-cols-2">{cards.map(([Icon,title,value,text])=><article key={title} className="rounded-2xl border border-border bg-white p-6"><Icon className="size-5 text-primary" /><p className="mt-5 text-sm text-muted-foreground">{title}</p><h2 className="mt-1 text-2xl">{value}</h2><p className="mt-3 text-sm leading-6 text-muted-foreground">{text}</p></article>)}</div><section className="mt-6 rounded-2xl border border-border bg-white p-6"><h2 className="text-xl">Admin access</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Only email addresses listed in the server-side administrator allowlist can enter this portal. Every administrator session must reach the AAL2 authenticator assurance level.</p></section></section><SiteFooter /></main>;
}
