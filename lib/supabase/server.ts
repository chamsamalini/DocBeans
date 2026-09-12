import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { getAdminEmails, getSupabasePublicConfig } from './config';

export async function createSupabaseServerClient() {
  const config = getSupabasePublicConfig();
  if (!config) return null;
  const cookieStore = await cookies();
  return createServerClient(config.url, config.publishableKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: values => {
        try {
          values.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Components cannot always write refreshed cookies. Route handlers can.
        }
      },
    },
  });
}

export async function getDocBeansUser(): Promise<User | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getUser();
  return error ? null : data.user;
}

export async function requireDocBeansUser(returnTo: string): Promise<User> {
  const user = await getDocBeansUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(returnTo)}`);
  return user;
}

export function isDocBeansAdmin(user: User) {
  const email = user.email?.toLowerCase();
  return Boolean(email && getAdminEmails().has(email));
}

export async function requireDocBeansAdmin() {
  const user = await requireDocBeansUser('/admin');
  if (!isDocBeansAdmin(user)) redirect('/portal?notice=admin-access-required');
  const supabase = await createSupabaseServerClient();
  const assurance = await supabase?.auth.mfa.getAuthenticatorAssuranceLevel();
  if (assurance?.data?.currentLevel !== 'aal2') redirect('/portal?mfa=required&next=/admin');
  return user;
}
