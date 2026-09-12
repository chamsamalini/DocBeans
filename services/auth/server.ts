import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import type { AuthUser } from './contracts';
import { getAdminEmails, getPublicAuthConfig, isAuthenticationDisabled } from './config';
import { createSupabaseServerAuthService } from './adapters/supabase/server';

function createServerAuthService() {
  const config = getPublicAuthConfig();
  if (!config) return null;
  if (config.provider === 'supabase') return createSupabaseServerAuthService(config);
  return null;
}

export async function getAuthenticatedUser():Promise<AuthUser|null> {
  if (isAuthenticationDisabled()) {
    const requestHeaders = await headers();
    const fallbackEmail = getAdminEmails().values().next().value || 'owner@docbeans.local';
    const email = requestHeaders.get('oai-authenticated-user-email') || fallbackEmail;
    return {
      id: requestHeaders.get('oai-authenticated-user-id') || `temporary:${email}`,
      email,
      displayName: requestHeaders.get('oai-authenticated-user-full-name') || 'DocBeans owner',
    };
  }
  return (await createServerAuthService()?.getUser())||null;
}

export async function requireAuthenticatedUser(returnTo:string):Promise<AuthUser> {
  const user=await getAuthenticatedUser();
  if(!user) redirect(`/login?next=${encodeURIComponent(returnTo)}`);
  return user;
}

export function isAdministrator(user:AuthUser) {
  return Boolean(user.email&&getAdminEmails().has(user.email.toLowerCase()));
}

export async function requireAdministrator() {
  const user=await requireAuthenticatedUser('/admin');
  if(!isAdministrator(user)) redirect('/portal?notice=admin-access-required');
  if(isAuthenticationDisabled()) return user;
  const assurance=await createServerAuthService()?.getAssuranceLevel();
  if(assurance!=='aal2') redirect('/portal?mfa=required&next=/admin');
  return user;
}

export async function exchangeAuthorizationCode(code:string) {
  const service=createServerAuthService();
  if(!service) throw new Error('Account service is not configured.');
  await service.exchangeAuthorizationCode(code);
}
