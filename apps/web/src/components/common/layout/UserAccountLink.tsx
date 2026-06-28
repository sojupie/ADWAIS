import {Link} from '@tanstack/react-router';

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
        ? 'flex items-center px-2.5 py-1 rounded-md text-xs font-bold text-slate-300 bg-white/5 border border-white/10 hover:bg-white/10 transition-colors whitespace-nowrap shrink-0 max-w-[120px] truncate'
        : 'flex items-center gap-3 bg-brand-bg-primary/45 hover:bg-brand-bg-primary/60 border border-white/10 hover:border-white/20 px-3.5 py-1.5 rounded-lg shadow-sm whitespace-nowrap shrink-0 text-sm font-bold text-slate-300 transition-colors cursor-pointer'}
    >
      {label}
    </Link>
  );
}
