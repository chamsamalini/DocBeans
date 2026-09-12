import type { ReactNode } from 'react';
import { MarketingHeader } from '@/components/marketing-header';
import { SiteFooter } from '@/components/site-footer';

export function MarketingPage({ kicker, title, intro, children }:{ kicker:string; title:string; intro:string; children:ReactNode }) {
  return <main className="min-h-screen bg-background text-foreground"><MarketingHeader /><section className="mx-auto max-w-[1080px] px-5 py-12 sm:px-8 sm:py-16"><p className="marketing-kicker">{kicker}</p><h1 className="mt-3 max-w-4xl font-heading text-4xl leading-tight tracking-[-.04em] sm:text-5xl">{title}</h1><p className="mt-5 max-w-3xl text-lg leading-8 text-muted-foreground">{intro}</p><div className="mt-10">{children}</div></section><SiteFooter /></main>;
}
