import { Bean } from 'lucide-react';

export function BrandLogo() {
  return <span className="inline-flex items-center gap-2.5 leading-none">
    <span className="grid size-9 shrink-0 place-items-center rounded-md bg-accent text-accent-foreground shadow-sm"><Bean className="size-5" /></span>
    <span className="text-lg font-semibold tracking-[-0.025em]">DocBeans</span>
  </span>;
}
