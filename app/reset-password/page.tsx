import Link from 'next/link';
import { BrandLogo } from '@/components/brand-logo';
import { ResetPasswordForm } from './reset-password-form';
import { getPublicAuthConfig } from '@/services/auth/config';

export const dynamic = 'force-dynamic';
export default function ResetPasswordPage(){return <main className="min-h-screen bg-white"><header className="border-b border-border"><div className="mx-auto flex h-16 max-w-[1000px] items-center justify-between px-5"><Link href="/"><BrandLogo/></Link><Link href="/login" className="text-sm font-semibold">Back to sign in</Link></div></header><section className="mx-auto max-w-md px-5 py-16"><h1 className="text-4xl tracking-[-.04em]">Choose a new password.</h1><ResetPasswordForm config={getPublicAuthConfig()}/></section></main>}
