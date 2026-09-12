'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LoaderCircle, LogOut } from 'lucide-react';
import type { SupabasePublicConfig } from '@/lib/supabase/config';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

export function SignOutButton({ config }: { config:SupabasePublicConfig }) {
  const router = useRouter();
  const supabase = useMemo(()=>createSupabaseBrowserClient(config),[config]);
  const [busy,setBusy] = useState(false);
  const signOut = async () => { setBusy(true); await supabase.auth.signOut(); router.push('/'); router.refresh(); };
  return <button type="button" disabled={busy} onClick={signOut} className="inline-flex items-center gap-2 text-sm font-semibold hover:text-primary">{busy?<LoaderCircle className="size-4 animate-spin"/>:<LogOut className="size-4"/>} Sign out</button>;
}
