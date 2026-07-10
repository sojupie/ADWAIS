import {Link} from '@tanstack/react-router';
import { User } from 'lucide-react';

type UserAccountLinkProps = {
  label: string | null;
  variant: 'mobile' | 'desktop';
};

export function UserAccountLink({label, variant}: UserAccountLinkProps) {
  if (!label) return null;

  return (
    <Link
      to="/settings/authentication"
      className={variant === 'mobile'
        ? 'flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-white bg-brand-btn-primary hover:bg-brand-btn-primary/90 active:bg-brand-btn-primary/80 transition-colors whitespace-nowrap shrink-0 max-w-[120px] truncate border-none'
        : 'flex items-center gap-2 bg-brand-btn-primary hover:bg-brand-btn-primary/90 active:bg-brand-btn-primary/80 border-none px-4 py-1.5 rounded-full shadow-md hover:shadow-lg whitespace-nowrap shrink-0 text-sm font-bold text-white transition-all cursor-pointer'}
    >
      <User size={variant === 'mobile' ? 14 : 16} className="shrink-0" />
      <span className="truncate">{label}</span>
    </Link>
  );
}
