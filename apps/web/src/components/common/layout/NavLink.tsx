import { Link, type LinkOptions } from '@tanstack/react-router';
import type { ReactNode } from 'react';

interface NavLinkProps extends Omit<LinkOptions, 'className' | 'activeProps'> {
  children: ReactNode;
}

export function NavLink(props: NavLinkProps) {
  return (
    <Link
      {...props}
      activeOptions={{ includeSearch: false }}
      className="text-sm font-extrabold text-white/60 hover:text-white transition-all no-underline pb-1 border-b-4 border-transparent uppercase tracking-wider"
      activeProps={{ className: '!text-brand-accent !border-brand-accent' }}
    >
      {props.children}
    </Link>
  );
}
