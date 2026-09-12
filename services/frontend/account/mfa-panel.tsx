'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, LoaderCircle, ShieldCheck, Smartphone } from 'lucide-react';
import type { AuthFactor, PublicAuthConfig } from '@/services/auth/contracts';
import { createBrowserAuthService } from '@/services/auth/client';
import { Button } from '@/components/ui/button';

type Enrollment = { id:string; qr:string; secret:string } | null;

export function MfaPanel({ config, required=false, next='/portal' }: { config:PublicAuthConfig; required?:boolean; next?:string }) {
  const router = useRouter();
  const auth = useMemo(()=>createBrowserAuthService(config),[config]);
  const [factors,setFactors] = useState<AuthFactor[]>([]);
  const [enrollment,setEnrollment] = useState<Enrollment>(null);
  const [code,setCode] = useState('');
  const [busy,setBusy] = useState('load');
  const [error,setError] = useState('');
  const safeNext = next.startsWith('/') && !next.startsWith('//') ? next : '/portal';

  const load = async () => { try{setFactors(await auth.listTotpFactors());}catch(loadError){setError(loadError instanceof Error?loadError.message:'MFA settings could not be loaded.');}setBusy(''); };
  useEffect(()=>{void load();},[]);
  const enroll = async () => { setBusy('enroll');setError('');try{const data=await auth.enrollTotp('DocBeans authenticator');setEnrollment({id:data.id,qr:data.qrCode,secret:data.secret});}catch(enrollError){setError(enrollError instanceof Error?enrollError.message:'Authenticator setup failed.');}setBusy(''); };
  const verify = async () => { if(!enrollment)return;setBusy('verify');setError('');try{await auth.verifyTotp(enrollment.id,code.replace(/\s/g,''));setEnrollment(null);setCode('');await load();router.push(safeNext);router.refresh();}catch(verifyError){setError(verifyError instanceof Error?verifyError.message:'The verification code was rejected.');}setBusy(''); };
  const remove = async (factorId:string) => { setBusy(factorId);setError('');try{await auth.removeTotp(factorId);await load();}catch(removeError){setError(removeError instanceof Error?removeError.message:'The authenticator could not be removed.');}setBusy(''); };
  const active = factors.filter(factor=>factor.status==='verified');

  return <section className={`rounded-2xl border bg-white p-6 ${required?'border-amber-300 ring-2 ring-amber-100':'border-border'}`}><div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-secondary text-primary"><ShieldCheck className="size-5"/></span><div><p className="marketing-kicker">Security</p><h2 className="mt-1 text-xl">Authenticator MFA</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Use Google Authenticator, Microsoft Authenticator, 1Password or another TOTP app.</p></div></div>
    {required&&active.length===0&&<p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">Authenticator MFA is required before opening the admin portal.</p>}
    {busy==='load'?<LoaderCircle className="mt-6 size-5 animate-spin text-primary"/>:active.length>0?<div className="mt-5 space-y-3">{active.map(factor=><div key={factor.id} className="flex items-center gap-3 rounded-xl border border-border p-3"><CheckCircle2 className="size-4 text-emerald-600"/><span className="flex-1 text-sm font-medium">{factor.friendlyName||'Authenticator app'}</span><button type="button" onClick={()=>remove(factor.id)} disabled={Boolean(busy)} className="text-xs font-semibold text-red-700">Remove</button></div>)}</div>:!enrollment&&<Button type="button" variant="outline" className="mt-5 w-full" disabled={Boolean(busy)} onClick={enroll}><Smartphone/> Set up authenticator</Button>}
    {enrollment&&<div className="mt-5 rounded-xl border border-border p-4"><p className="text-sm font-semibold">Scan this QR code</p><img src={enrollment.qr} alt="Authenticator enrolment QR code" className="mt-3 size-40 rounded-lg border border-border"/><p className="mt-3 text-xs leading-5 text-muted-foreground">Can’t scan it? Enter this setup key: <code className="break-all font-mono text-foreground">{enrollment.secret}</code></p><label htmlFor="totp-code" className="field-label mt-4 block">Six-digit code</label><input id="totp-code" className="field-control mt-2" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,''))} placeholder="000000"/><Button type="button" className="mt-3 w-full" disabled={code.length!==6||Boolean(busy)} onClick={verify}>{busy==='verify'&&<LoaderCircle className="animate-spin"/>} Verify authenticator</Button></div>}
    {error&&<p role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
  </section>;
}
