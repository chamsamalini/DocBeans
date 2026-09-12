import { env } from 'cloudflare:workers';
import type { AuthProvider, PublicAuthConfig } from './contracts';

function runtimeValue(name: string) {
  const workerValue = (env as unknown as Record<string, unknown>)[name];
  if (typeof workerValue === 'string' && workerValue.trim()) return workerValue.trim();
  const processValue = process.env[name];
  return typeof processValue === 'string' ? processValue.trim() : '';
}

export function getConfiguredAuthProvider(): AuthProvider {
  const provider = runtimeValue('DOCBEANS_AUTH_PROVIDER').toLowerCase();
  if (provider === 'disabled') return 'disabled';
  return provider === 'auth0' ? 'auth0' : 'supabase';
}

export function isAuthenticationDisabled() {
  return getConfiguredAuthProvider() === 'disabled';
}

export function getPublicAuthConfig(): PublicAuthConfig | null {
  const provider = getConfiguredAuthProvider();
  if (provider === 'disabled') return null;
  if (provider === 'supabase') {
    const endpoint = runtimeValue('SUPABASE_URL') || runtimeValue('NEXT_PUBLIC_SUPABASE_URL');
    const publicKey = runtimeValue('SUPABASE_PUBLISHABLE_KEY') || runtimeValue('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY');
    return endpoint && publicKey ? { provider, endpoint, publicKey } : null;
  }
  // Auth0 is a reserved provider slot. Adding its adapter here is the only
  // authentication change required; frontend and backend consumers stay stable.
  return null;
}

export function getAdminEmails() {
  return new Set(runtimeValue('DOCBEANS_ADMIN_EMAILS').split(',').map(value => value.trim().toLowerCase()).filter(Boolean));
}
