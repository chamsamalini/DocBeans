'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Building2, Eye, EyeOff, LoaderCircle, Mail, UserPlus } from 'lucide-react';
import type { PublicAuthConfig, SocialProvider } from '@/services/auth/contracts';
import { createBrowserAuthService } from '@/services/auth/client';
import { Button } from '@/components/ui/button';

type Mode = 'sign-in' | 'create';

export function AuthPanel({ config, initialEmail, next='/create' }: { config:PublicAuthConfig|null; initialEmail?:string|null; next?:string }) {
  const router = useRouter();
  const auth = useMemo(() => config ? createBrowserAuthService(config) : null, [config]);
  const [mode,setMode] = useState<Mode>('sign-in');
  const [email,setEmail] = useState('');
  const [password,setPassword] = useState('');
  const [showPassword,setShowPassword] = useState(false);
  const [busy,setBusy] = useState('');
  const [message,setMessage] = useState('');
  const [error,setError] = useState('');
  const safeNext = next.startsWith('/') && !next.startsWith('//') ? next : '/create';

  const oauth = async (provider:SocialProvider) => {
    if (!auth) return;
    setBusy(provider); setError('');
    const callback = `${window.location.origin}/auth/callback?next=${encodeURIComponent(safeNext)}`;
    try { await auth.signInWithSocial(provider,callback); }
    catch (authError) { setError(authError instanceof Error?authError.message:'Sign-in could not be started.'); setBusy(''); }
  };

  const submit = async (event:React.FormEvent) => {
    event.preventDefault();
    if (!auth) return;
    setBusy('email'); setError(''); setMessage('');
    if (mode === 'create') {
      const callback = `${window.location.origin}/auth/callback?next=${encodeURIComponent(safeNext)}`;
      try { const result=await auth.signUpWithPassword(email.trim(),password,callback); if(result.sessionCreated){router.push(safeNext);router.refresh();}else setMessage(`We sent a verification link to ${email.trim()}. Open it to activate your DocBeans account.`); }
      catch(authError){setError(authError instanceof Error?authError.message:'Account creation failed.');}
    } else {
      try { await auth.signInWithPassword(email.trim(),password); router.push(safeNext);router.refresh(); }
      catch(authError){setError(authError instanceof Error?authError.message:'Sign-in failed.');}
    }
    setBusy('');
  };

  const resetPassword = async () => {
    if (!auth || !email.trim()) { setError('Enter your email address first.'); return; }
    setBusy('reset'); setError('');
    const callback = `${window.location.origin}/auth/callback?next=/reset-password`;
    try { await auth.sendPasswordReset(email.trim(),callback);setMessage(`A password-reset link has been sent to ${email.trim()}.`); }
    catch(resetError){setError(resetError instanceof Error?resetError.message:'Password reset could not be started.');}
    setBusy('');
  };

  if (initialEmail) return <div className="rounded-[22px] border border-border bg-white p-7 shadow-[0_18px_55px_rgba(18,63,85,.09)] sm:p-8"><p className="marketing-kicker">Signed in</p><h2 className="mt-2 text-2xl">Welcome back</h2><p className="mt-3 text-sm leading-6 text-muted-foreground">Continue as {initialEmail}.</p><Button className="mt-6 h-11 w-full" onClick={()=>router.push(safeNext)}>Continue to DocBeans <ArrowRight /></Button></div>;

  if (!config) return <div className="rounded-[22px] border border-amber-200 bg-amber-50 p-7 sm:p-8"><h2 className="text-xl">Account service setup required</h2><p className="mt-3 text-sm leading-6 text-amber-950/75">The account interface is ready. Complete the selected account provider configuration to activate Google, Microsoft and work-email sign-in.</p></div>;

  return <div className="rounded-[22px] border border-border bg-white p-7 shadow-[0_18px_55px_rgba(18,63,85,.09)] sm:p-8">
    <div className="grid grid-cols-2 rounded-lg bg-muted p-1" role="tablist" aria-label="Account action"><button type="button" role="tab" aria-selected={mode==='sign-in'} onClick={()=>{setMode('sign-in');setError('');setMessage('');}} className={`rounded-md px-3 py-2 text-sm font-semibold ${mode==='sign-in'?'bg-white shadow-sm':'text-muted-foreground'}`}>Sign in</button><button type="button" role="tab" aria-selected={mode==='create'} onClick={()=>{setMode('create');setError('');setMessage('');}} className={`rounded-md px-3 py-2 text-sm font-semibold ${mode==='create'?'bg-white shadow-sm':'text-muted-foreground'}`}>Create account</button></div>
    <h2 className="mt-6 text-2xl">{mode==='create'?'Create your DocBeans account':'Welcome back'}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{mode==='create'?'Use Google, Microsoft 365 or any verified corporate email.':'Choose your usual sign-in method.'}</p>
    <div className="mt-5 grid gap-3 sm:grid-cols-2"><Button type="button" variant="outline" className="h-11" disabled={Boolean(busy)} onClick={()=>oauth('google')}>{busy==='google'?<LoaderCircle className="animate-spin"/>:<Mail/>} Google</Button><Button type="button" variant="outline" className="h-11" disabled={Boolean(busy)} onClick={()=>oauth('microsoft')}>{busy==='microsoft'?<LoaderCircle className="animate-spin"/>:<Building2/>} Microsoft</Button></div>
    <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />or use work email<span className="h-px flex-1 bg-border" /></div>
    <form onSubmit={submit} className="space-y-4"><div><label htmlFor="account-email" className="field-label">Email address</label><input id="account-email" className="field-control mt-2" type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="name@company.com" /></div><div><label htmlFor="account-password" className="field-label">Password</label><div className="relative mt-2"><input id="account-password" className="field-control pr-11" type={showPassword?'text':'password'} autoComplete={mode==='create'?'new-password':'current-password'} minLength={8} required value={password} onChange={e=>setPassword(e.target.value)} placeholder={mode==='create'?'At least 8 characters':'Your password'} /><button type="button" onClick={()=>setShowPassword(value=>!value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-label={showPassword?'Hide password':'Show password'}>{showPassword?<EyeOff className="size-4"/>:<Eye className="size-4"/>}</button></div></div>
      {error&&<p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}{message&&<p role="status" className="rounded-lg bg-emerald-50 px-3 py-2 text-sm leading-5 text-emerald-800">{message}</p>}
      <Button className="h-11 w-full" disabled={Boolean(busy)}>{busy==='email'?<LoaderCircle className="animate-spin"/>:mode==='create'?<UserPlus/>:<ArrowRight/>}{mode==='create'?'Create account':'Sign in with email'}</Button>
    </form>
    {mode==='sign-in'&&<button type="button" disabled={Boolean(busy)} onClick={resetPassword} className="mt-4 w-full text-center text-sm font-semibold text-primary hover:underline">Forgot password?</button>}
    <p className="mt-5 border-t border-border pt-5 text-xs leading-5 text-muted-foreground">Corporate addresses are accepted. Email accounts must be verified before use. By continuing, you agree to the DocBeans terms and data-protection policy.</p>
  </div>;
}
