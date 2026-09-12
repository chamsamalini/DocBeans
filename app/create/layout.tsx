import type { ReactNode } from 'react';
import { requireDocBeansUser } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function CreateLayout({ children }: { children: ReactNode }) {
  await requireDocBeansUser('/create');
  return children;
}
