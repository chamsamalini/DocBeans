import { NextResponse } from 'next/server';
import { exchangeAuthorizationCode } from '@/services/auth/server';

export async function GET(request:Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const requestedNext = url.searchParams.get('next') || '/create';
  const next = requestedNext.startsWith('/') && !requestedNext.startsWith('//') ? requestedNext : '/create';
  if (code) {
    try { await exchangeAuthorizationCode(code); return NextResponse.redirect(new URL(next, url.origin)); }
    catch { /* Redirect to a neutral authentication failure below. */ }
  }
  return NextResponse.redirect(new URL('/login?error=authentication-failed', url.origin));
}
