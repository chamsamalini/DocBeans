import type { ReactNode } from 'react';
import { requireAuthenticatedUser } from '@/services/auth/server';

export const dynamic = 'force-dynamic';

export default async function SettingsLayout({ children }: { children: ReactNode }) {
  await requireAuthenticatedUser('/settings');
  return children;
}
