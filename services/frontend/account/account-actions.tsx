'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LoaderCircle, LogOut } from 'lucide-react';
import type { PublicAuthConfig } from '@/services/auth/contracts';
import { createBrowserAuthService } from '@/services/auth/client';

export function SignOutButton({ config }: { config:PublicAuthConfig }) {
  const router = useRouter();
  const auth = useMemo(()=>createBrowserAuthService(config),[config]);
  const [busy,setBusy] = useState(false);
  const signOut = async () => { setBusy(true); await auth.signOut(); router.push('/'); router.refresh(); };
  return <button type="button" disabled={busy} onClick={signOut} className="inline-flex items-center gap-2 text-sm font-semibold hover:text-primary">{busy?<LoaderCircle className="size-4 animate-spin"/>:<LogOut className="size-4"/>} Sign out</button>;
}
