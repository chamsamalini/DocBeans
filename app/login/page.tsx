import Link from 'next/link';
import { LockKeyhole, ShieldCheck, UserPlus } from 'lucide-react';
import { BrandLogo } from '@/components/brand-logo';
import { SiteFooter } from '@/components/site-footer';
import { AuthPanel } from '@/services/frontend/account';
import { getAuthenticatedUser } from '@/services/auth/server';
import { getPublicAuthConfig } from '@/services/auth/config';

export const dynamic = 'force-dynamic';

export default async function LoginPage({searchParams}:{searchParams:Promise<{next?:string}>}) {
  const [user,params] = await Promise.all([getAuthenticatedUser(),searchParams]);
  return <main className="min-h-screen bg-white text-foreground"><header className="border-b border-border bg-white"><div className="mx-auto flex h-16 max-w-[1180px] items-center justify-between px-5 sm:px-8"><Link href="/" aria-label="DocBeans home"><BrandLogo /></Link><Link href="/" className="text-sm font-semibold text-muted-foreground hover:text-primary">Back to About</Link></div></header><section className="mx-auto grid max-w-[1040px] gap-10 px-5 py-14 sm:px-8 lg:grid-cols-[1fr_460px] lg:items-center lg:py-20"><div><h1 className="max-w-xl text-4xl leading-tight tracking-[-.04em] sm:text-5xl">One secure account for every document.</h1><p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground">Use Google, Microsoft 365 or a verified corporate email. Your account provides access to document creation, AI settings, billing and usage.</p><div className="mt-8 grid gap-3 text-sm text-muted-foreground"><p className="flex items-center gap-3"><LockKeyhole className="size-4 text-primary" /> Corporate email addresses are accepted and verified.</p><p className="flex items-center gap-3"><UserPlus className="size-4 text-primary" /> Google or Microsoft sign-in can create an account instantly.</p><p className="flex items-center gap-3"><ShieldCheck className="size-4 text-primary" /> Authenticator MFA is available and required for administrators.</p></div></div><AuthPanel config={getPublicAuthConfig()} initialEmail={user?.email} next={params.next}/></section><SiteFooter /></main>;
}
