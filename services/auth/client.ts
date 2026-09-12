'use client';

import type { BrowserAuthService, PublicAuthConfig } from './contracts';
import { createSupabaseBrowserAuthService } from './adapters/supabase/client';

export function createBrowserAuthService(config: PublicAuthConfig): BrowserAuthService {
  if (config.provider === 'supabase') return createSupabaseBrowserAuthService(config);
  throw new Error('The configured authentication provider adapter is not installed.');
}
