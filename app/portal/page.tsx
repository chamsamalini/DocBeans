import Link from 'next/link';
import { CreditCard, FilePlus2, Settings, ShieldCheck } from 'lucide-react';
import { BrandLogo } from '@/components/brand-logo';
import { SiteFooter } from '@/components/site-footer';
import { buttonVariants } from '@/components/ui/button';
import { MfaPanel, SignOutButton } from '@/services/frontend/account';
import { getPublicAuthConfig, isAuthenticationDisabled } from '@/services/auth/config';
import { isAdministrator, requireAuthenticatedUser } from '@/services/auth/server';
import { UsagePanel } from './usage-panel';

export const dynamic = 'force-dynamic';

export default async function UserPortalPage({
  searchParams,
}: {
  searchParams: Promise<{ mfa?: string; next?: string; notice?: string }>;
}) {
  const [user, params] = await Promise.all([requireAuthenticatedUser('/portal'), searchParams]);
  const config = getPublicAuthConfig();
  const authDisabled = isAuthenticationDisabled();
  const admin = isAdministrator(user);

  return (
    <main className="min-h-screen bg-white text-foreground">
      <header className="border-b border-border bg-white">
        <div className="mx-auto flex h-16 max-w-[1180px] items-center gap-4 px-5 sm:px-8">
          <Link href="/"><BrandLogo /></Link>
          <span className="hidden text-sm text-muted-foreground sm:inline">User portal</span>
          <div className="ml-auto flex items-center gap-3">
            {authDisabled && <span className="hidden rounded-full bg-secondary px-3 py-1 text-xs font-semibold sm:inline">Temporary access</span>}
            {admin && <Link href="/admin" className={buttonVariants({ variant: 'outline', size: 'sm' })}>Admin portal</Link>}
            <span className="hidden text-sm text-muted-foreground lg:inline">{user.email}</span>
            {config && <SignOutButton config={config} />}
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-[1080px] px-5 py-12 sm:px-8">
        {params.notice === 'admin-access-required' && <p className="mb-6 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">This account is not on the DocBeans administrator allowlist.</p>}
        {params.notice === 'password-updated' && <p className="mb-6 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">Your password has been updated.</p>}
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <h1 className="text-4xl tracking-[-.04em]">Account, billing and usage.</h1>
            <p className="mt-3 text-base text-muted-foreground">Manage DocBeans access and see generation activity in one place.</p>
          </div>
          <Link href="/create" className={buttonVariants({ className: 'gap-2' })}><FilePlus2 className="size-4" /> Create document</Link>
        </div>

        <div className="mt-9 grid gap-6 lg:grid-cols-[1.35fr_.65fr]">
          <div className="space-y-6">
            <UsagePanel />
            {config && <MfaPanel config={config} required={params.mfa === 'required'} next={params.next} />}
            {authDisabled && <section className="rounded-2xl border border-border bg-white p-6"><ShieldCheck className="size-5 text-primary" /><h2 className="mt-4 text-lg">Temporary no-login mode</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">DocBeans account sign-in and authenticator MFA are paused. Access is currently limited by the Site’s owner-only hosting policy.</p></section>}
          </div>

          <aside className="space-y-6">
            <section className="rounded-2xl border border-border bg-white p-6">
              <CreditCard className="size-5 text-primary" />
              <p className="marketing-kicker mt-5">Billing</p>
              <h2 className="mt-2 text-2xl">DocBeans Platform</h2>
              <p className="mt-3 text-3xl font-semibold">US$7 <span className="text-sm font-normal text-muted-foreground">/ month</span></p>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">Checkout is not connected yet. No subscription or payment is taken from this portal.</p>
              <button disabled className="mt-5 h-10 w-full rounded-md bg-muted text-sm font-semibold text-muted-foreground">Billing management coming soon</button>
            </section>
            <section className="rounded-2xl border border-border bg-white p-6">
              <ShieldCheck className="size-5 text-primary" />
              <h2 className="mt-4 text-lg">Workspace settings</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">Choose Anthropic or OpenAI and configure managed AI or BYOK.</p>
              <Link href="/settings" className={buttonVariants({ variant: 'outline', className: 'mt-5 w-full gap-2' })}><Settings className="size-4" /> AI settings</Link>
            </section>
          </aside>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
