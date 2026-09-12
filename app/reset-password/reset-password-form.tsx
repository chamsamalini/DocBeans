'use client';
import { useMemo,useState } from 'react';
import { useRouter } from 'next/navigation';
import type { PublicAuthConfig } from '@/services/auth/contracts';
import { createBrowserAuthService } from '@/services/auth/client';
import { Button } from '@/components/ui/button';
export function ResetPasswordForm({config}:{config:PublicAuthConfig|null}){const router=useRouter();const auth=useMemo(()=>config?createBrowserAuthService(config):null,[config]);const [password,setPassword]=useState('');const [error,setError]=useState('');const submit=async(e:React.FormEvent)=>{e.preventDefault();if(!auth)return;try{await auth.updatePassword(password);router.push('/portal?notice=password-updated');router.refresh();}catch(authError){setError(authError instanceof Error?authError.message:'The password could not be updated.');}};return <form onSubmit={submit} className="mt-8 rounded-2xl border border-border p-6"><label htmlFor="new-password" className="field-label">New password</label><input id="new-password" className="field-control mt-2" type="password" minLength={8} required value={password} onChange={e=>setPassword(e.target.value)} placeholder="At least 8 characters"/>{error&&<p className="mt-3 text-sm text-red-700">{error}</p>}<Button className="mt-4 w-full" disabled={!config}>Update password</Button></form>}
