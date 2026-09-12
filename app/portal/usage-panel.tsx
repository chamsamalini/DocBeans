'use client';

import { useEffect, useState } from 'react';

type UsageTotals = { generations:number; inputTokens:number; outputTokens:number; credits:number; providerCostUsd:number; customerChargeSgd:number };
const emptyUsage:UsageTotals = { generations:0, inputTokens:0, outputTokens:0, credits:0, providerCostUsd:0, customerChargeSgd:0 };

export function UsagePanel() {
  const [usage,setUsage] = useState<UsageTotals>(emptyUsage);
  useEffect(()=>{
    try {
      const saved = window.localStorage.getItem('docbeans-usage-totals');
      if (saved) setUsage({...emptyUsage,...JSON.parse(saved)});
    } catch { /* Device-local usage is optional. */ }
  },[]);
  const rows = [
    ['Successful generations', usage.generations.toLocaleString()],
    ['Input tokens', usage.inputTokens.toLocaleString()],
    ['Output tokens', usage.outputTokens.toLocaleString()],
    ['DocBeans credits', usage.credits.toLocaleString()],
    ['Estimated provider cost', `US$${usage.providerCostUsd.toFixed(4)}`],
    ['DocBeans AI charges', `SGD ${usage.customerChargeSgd.toFixed(2)}`],
  ];
  return <section className="rounded-2xl border border-border bg-white p-6"><div className="flex items-start justify-between gap-4"><div><p className="marketing-kicker">Usage</p><h2 className="mt-2 text-2xl">This browser</h2></div><span className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">Device-local</span></div><div className="mt-6 grid gap-3 sm:grid-cols-2">{rows.map(([label,value])=><div key={label} className="rounded-xl border border-border p-4"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 text-xl font-semibold">{value}</p></div>)}</div><p className="mt-5 text-xs leading-5 text-muted-foreground">Usage is recorded on this device after successful generations. Account-wide billing history will appear here when checkout and persistent billing are connected.</p></section>;
}
