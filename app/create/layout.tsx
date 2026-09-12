import type { ReactNode } from 'react';
import { requireAuthenticatedUser } from '@/services/auth/server';

export const dynamic = 'force-dynamic';

export default async function CreateLayout({ children }: { children: ReactNode }) {
  await requireAuthenticatedUser('/create');
  return children;
}
