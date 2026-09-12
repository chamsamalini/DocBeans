import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(request:Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const requestedNext = url.searchParams.get('next') || '/create';
  const next = requestedNext.startsWith('/') && !requestedNext.startsWith('//') ? requestedNext : '/create';
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.redirect(new URL('/login?error=account-service-unavailable', url.origin));
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, url.origin));
  }
  return NextResponse.redirect(new URL('/login?error=authentication-failed', url.origin));
}
