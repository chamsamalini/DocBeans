import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { BrandLogo } from '@/components/brand-logo';

export function MarketingHeader() {
  return <header className="sticky top-0 z-30 border-b border-border bg-white/95 backdrop-blur"><div className="mx-auto flex h-16 max-w-[1180px] items-center gap-6 px-4 sm:px-6"><Link href="/" aria-label="DocBeans home"><BrandLogo /></Link><nav className="ml-auto hidden items-center gap-6 text-sm font-semibold text-muted-foreground md:flex" aria-label="Website"><Link className="hover:text-primary" href="/">About</Link><Link className="hover:text-primary" href="/pricing">Pricing</Link><Link className="hover:text-primary" href="/manual">Manual</Link></nav><Link href="/login" className={buttonVariants({className:'ml-auto md:ml-2'})}>Create document</Link></div></header>;
}
