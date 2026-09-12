'use client';
import { useMemo,useState } from 'react';
import { useRouter } from 'next/navigation';
import type { SupabasePublicConfig } from '@/lib/supabase/config';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
export function ResetPasswordForm({config}:{config:SupabasePublicConfig|null}){const router=useRouter();const supabase=useMemo(()=>config?createSupabaseBrowserClient(config):null,[config]);const [password,setPassword]=useState('');const [error,setError]=useState('');const submit=async(e:React.FormEvent)=>{e.preventDefault();if(!supabase)return;const {error:authError}=await supabase.auth.updateUser({password});if(authError)setError(authError.message);else{router.push('/portal?notice=password-updated');router.refresh();}};return <form onSubmit={submit} className="mt-8 rounded-2xl border border-border p-6"><label htmlFor="new-password" className="field-label">New password</label><input id="new-password" className="field-control mt-2" type="password" minLength={8} required value={password} onChange={e=>setPassword(e.target.value)} placeholder="At least 8 characters"/>{error&&<p className="mt-3 text-sm text-red-700">{error}</p>}<Button className="mt-4 w-full" disabled={!config}>Update password</Button></form>}
