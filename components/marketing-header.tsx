import Link from 'next/link';
import { Settings } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { BrandLogo } from '@/components/brand-logo';

export function MarketingHeader() {
  return <header className="sticky top-0 z-30 border-b border-border bg-white/95 backdrop-blur"><div className="mx-auto flex h-16 max-w-[1180px] items-center gap-6 px-4 sm:px-6"><Link href="/" aria-label="DocBeans home"><BrandLogo /></Link><nav className="ml-auto hidden items-center gap-6 text-sm font-semibold text-muted-foreground md:flex" aria-label="Website"><Link className="hover:text-primary" href="/features">Features</Link><Link className="hover:text-primary" href="/pricing">Pricing</Link><Link className="hover:text-primary" href="/manual">Manual</Link><Link className="hover:text-primary" href="/policy">Policy</Link></nav><Link href="/settings" className={buttonVariants({variant:'outline',className:'ml-auto gap-2 md:ml-2'})}><Settings className="size-4" /> <span className="hidden sm:inline">AI settings</span></Link><Link href="/" className={buttonVariants({className:'hidden sm:inline-flex'})}>Create document</Link></div></header>;
}
