'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bean, Check, ChevronDown, CircleHelp, FileText, KeyRound, LockKeyhole, Settings, ShieldCheck, Sparkles } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { clearSessionApiKey, defaultAiSettings, llmModels, loadAiSettings, saveAiSettings } from '@/lib/ai-settings';
import type { AiSettings, CredentialMode, LlmProvider } from '@/lib/ai-settings';
import { SiteFooter } from '@/components/site-footer';

export default function AiSettingsPage() {
  const [settings, setSettings] = useState<AiSettings>(defaultAiSettings);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => { if (active) setSettings(loadAiSettings()); });
    return () => { active = false; };
  }, []);

  const selectProvider = (provider:LlmProvider) => {
    setSettings(current=>({ ...current, provider, model:llmModels[provider][0].value, apiKey:'' }));
    clearSessionApiKey();
    setSaved(false);
  };

  const selectCredentialMode = (credentialMode:CredentialMode) => {
    setSettings(current=>({ ...current, credentialMode, apiKey:credentialMode === 'managed' ? '' : current.apiKey }));
    if (credentialMode === 'managed') clearSessionApiKey();
    setSaved(false);
  };

  const save = () => {
    saveAiSettings(settings);
    setSaved(true);
    window.setTimeout(()=>setSaved(false), 2200);
  };

  const needsKey = settings.credentialMode === 'byok' && !settings.apiKey.trim();
  const selectedModel = llmModels[settings.provider].find(item=>item.value === settings.model);

  return <main className="min-h-screen bg-background text-foreground">
    <header className="sticky top-0 z-30 flex h-16 items-center border-b border-border bg-background/95 px-4 backdrop-blur sm:px-6 xl:px-7">
      <Link href="/" className="flex items-center gap-2.5" aria-label="DocBeans home"><span className="grid size-9 place-items-center rounded-md bg-primary text-primary-foreground shadow-sm"><Bean className="size-5" /></span><span className="flex flex-col leading-none"><span className="font-brand text-[9px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">chams.ai</span><span className="mt-1 text-base font-semibold tracking-[-0.02em]">DocBeans</span></span><Badge className="ml-1 bg-accent text-[10px] text-accent-foreground">BETA</Badge></Link>
      <div className="ml-auto"><Link href="/" className={buttonVariants({variant:'outline',className:'h-9 bg-card'})}>Back to documents</Link></div>
    </header>

    <div className="grid min-h-[calc(100vh-64px)] grid-cols-1 lg:grid-cols-[245px_minmax(0,1fr)]">
      <aside className="hidden flex-col border-r border-border bg-sidebar px-3 py-5 lg:flex"><Link href="/" className={buttonVariants({className:'h-10 justify-start gap-2.5 rounded-xl px-3'})}><FileText /> New document</Link><nav aria-label="Primary" className="mt-5 space-y-1"><Link className="nav-link" href="/"><FileText /> Documents</Link><Link className="nav-link" href="/features">Features</Link><Link className="nav-link" href="/pricing">Pricing</Link><Link className="nav-link" href="/manual">Manual</Link><Link className="nav-link" href="/about"><CircleHelp /> About DocBeans</Link></nav><div className="mt-auto rounded-xl border border-border bg-white/50 p-3"><p className="text-[11px] font-semibold text-foreground">chams.ai workspace</p><div className="mt-2 flex items-center gap-2 text-[10px] text-muted-foreground"><ShieldCheck className="size-3" /> Protected knowledge</div></div><div className="mt-3 border-t border-border pt-3"><Link className="nav-link nav-link-active" href="/settings"><Settings /> AI settings</Link></div></aside>

      <section className="px-4 py-7 sm:px-8 xl:px-12 xl:py-9"><div className="mx-auto max-w-[920px]">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground"><Link href="/">DocBeans</Link><span>/</span><span>Settings</span></div>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-4"><div><h1 className="font-heading text-3xl font-normal tracking-[-0.025em] sm:text-[38px]">AI provider settings</h1><p className="mt-2 max-w-2xl text-base leading-7 text-muted-foreground">Choose the AI used across DocBeans and decide who provides the API key.</p></div><Badge variant="outline" className="mt-2 h-7 gap-1.5 bg-card px-3"><span className="size-1.5 rounded-full bg-emerald-500" /> Application-wide</Badge></div>

        <div className="mt-7 grid gap-6 xl:grid-cols-[minmax(0,1fr)_270px]">
          <section className="overflow-hidden rounded-[20px] border border-border bg-card shadow-[0_16px_50px_rgba(0,0,0,0.06)]">
            <div className="border-b border-border px-6 py-5 sm:px-8"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-lg bg-primary text-primary-foreground"><Sparkles className="size-4" /></span><div><h2 className="text-lg font-semibold">Generation model</h2><p className="mt-0.5 text-sm text-muted-foreground">These choices apply to every AI-generated document.</p></div></div></div>
            <div className="space-y-7 p-6 sm:p-8">
              <fieldset><legend className="field-label">Provider</legend><div className="mt-3 grid gap-3 sm:grid-cols-2">{(['anthropic','openai'] as const).map(provider=><button type="button" key={provider} onClick={()=>selectProvider(provider)} className={`rounded-xl border p-4 text-left transition ${settings.provider===provider?'border-primary bg-secondary ring-1 ring-primary/15':'border-border bg-white hover:border-primary/40'}`}><span className="flex items-center justify-between"><span className="font-semibold">{provider === 'anthropic' ? 'Anthropic' : 'OpenAI'}</span><span className={`grid size-5 place-items-center rounded-full border ${settings.provider===provider?'border-primary bg-primary text-white':'border-input'}`}>{settings.provider===provider&&<Check className="size-3" />}</span></span><span className="mt-1.5 block text-sm text-muted-foreground">{provider === 'anthropic' ? 'Claude models' : 'GPT models'}</span></button>)}</div></fieldset>

              <div><label htmlFor="settings-model" className="field-label">Model</label><div className="relative mt-2"><select id="settings-model" className="field-control appearance-none pr-10" value={settings.model} onChange={e=>{setSettings(current=>({...current,model:e.target.value}));setSaved(false);}}>{llmModels[settings.provider].map(item=><option value={item.value} key={item.value}>{item.label}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-3.5 size-4 text-muted-foreground" /></div><p className="field-help">{selectedModel?.description}</p></div>

              <fieldset><legend className="field-label">API key source</legend><div className="mt-3 grid gap-3 sm:grid-cols-2"><button type="button" onClick={()=>selectCredentialMode('managed')} className={`rounded-xl border p-4 text-left transition ${settings.credentialMode==='managed'?'border-primary bg-secondary ring-1 ring-primary/15':'border-border bg-white hover:border-primary/40'}`}><span className="flex items-center gap-2 font-semibold"><ShieldCheck className="size-4" /> DocBeans managed key</span><span className="mt-1.5 block text-sm leading-5 text-muted-foreground">Use the key configured by the application administrator.</span></button><button type="button" onClick={()=>selectCredentialMode('byok')} className={`rounded-xl border p-4 text-left transition ${settings.credentialMode==='byok'?'border-primary bg-secondary ring-1 ring-primary/15':'border-border bg-white hover:border-primary/40'}`}><span className="flex items-center gap-2 font-semibold"><KeyRound className="size-4" /> Bring your own key</span><span className="mt-1.5 block text-sm leading-5 text-muted-foreground">Use your own provider account and billing.</span></button></div></fieldset>

              {settings.credentialMode === 'byok' && <div className="rounded-xl border border-border bg-[#fafafa] p-4 sm:p-5"><label htmlFor="settings-api-key" className="field-label">{settings.provider === 'anthropic' ? 'Anthropic' : 'OpenAI'} API key <span>*</span></label><input id="settings-api-key" type="password" autoComplete="off" className="field-control mt-2 font-mono" value={settings.apiKey} onChange={e=>{setSettings(current=>({...current,apiKey:e.target.value}));setSaved(false);}} placeholder={settings.provider === 'anthropic' ? 'sk-ant-…' : 'sk-…'} /><p className="field-help"><LockKeyhole className="mr-1 inline size-3" />Kept only in this browser tab. It is cleared when the tab closes and is never included in DocBeans logs.</p></div>}

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5"><p className="text-sm text-muted-foreground">Current choice: <span className="font-semibold text-foreground">{settings.provider === 'anthropic' ? 'Anthropic' : 'OpenAI'} · {selectedModel?.label}</span></p><Button onClick={save} disabled={needsKey}>{saved ? <><Check /> Saved</> : 'Save AI settings'}</Button></div>
            </div>
          </section>

          <aside className="space-y-4"><div className="rounded-[18px] border border-border bg-card p-5"><h2 className="text-sm font-semibold">How this works</h2><ol className="mt-4 space-y-3 text-sm text-muted-foreground"><li className="flex gap-3"><span className="grid size-6 shrink-0 place-items-center rounded-full bg-muted text-xs font-semibold text-foreground">1</span>Select a provider and model.</li><li className="flex gap-3"><span className="grid size-6 shrink-0 place-items-center rounded-full bg-muted text-xs font-semibold text-foreground">2</span>Choose the managed key or BYOK.</li><li className="flex gap-3"><span className="grid size-6 shrink-0 place-items-center rounded-full bg-muted text-xs font-semibold text-foreground">3</span>Save once for all document workflows.</li></ol></div><div className="rounded-[18px] bg-primary p-5 text-primary-foreground"><LockKeyhole className="size-5" /><h2 className="mt-3 text-sm font-semibold">Session-only BYOK</h2><p className="mt-2 text-sm leading-6 text-white/70">Your key is not added to a document, analytics event or server log. Closing this browser tab clears it.</p></div></aside>
        </div>
      </div></section>
    </div>
    <SiteFooter />
  </main>;
}
