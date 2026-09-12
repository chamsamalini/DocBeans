import { env } from 'cloudflare:workers';

export type SupabasePublicConfig = { url: string; publishableKey: string };

function runtimeValue(name: string) {
  const workerValue = (env as unknown as Record<string, unknown>)[name];
  if (typeof workerValue === 'string' && workerValue.trim()) return workerValue.trim();
  const processValue = process.env[name];
  return typeof processValue === 'string' ? processValue.trim() : '';
}

export function getSupabasePublicConfig(): SupabasePublicConfig | null {
  const url = runtimeValue('SUPABASE_URL') || runtimeValue('NEXT_PUBLIC_SUPABASE_URL');
  const publishableKey = runtimeValue('SUPABASE_PUBLISHABLE_KEY') || runtimeValue('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY');
  return url && publishableKey ? { url, publishableKey } : null;
}

export function getAdminEmails() {
  return new Set(runtimeValue('DOCBEANS_ADMIN_EMAILS').split(',').map(value => value.trim().toLowerCase()).filter(Boolean));
}
