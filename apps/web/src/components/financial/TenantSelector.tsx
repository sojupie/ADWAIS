import { useTenantsQuery } from '../../hooks/useTenantQueries';
import { Select } from '../common/ui/Select';
import { useSearch } from '@tanstack/react-router';
import { useMemo } from 'react';
import { Route } from '../../routes/financial';

const dropdownIcon = (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="text-white/70"
  >
    <path d="m6 9 6 6 6-6" />
  </svg>
);

export function TenantSelector() {
  const search = useSearch({ from: Route.fullPath });
  const navigate = Route.useNavigate();
  const { data: tenants, isLoading } = useTenantsQuery();

  const activeValue = search.tenantId || 'global';

  const handleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    void navigate({
      search: (prev) => ({
        ...prev,
        tenantId: val === 'global' ? undefined : val
      })
    });
  };

  const sortedTenants = useMemo(() => {
    if (!tenants) return [];
    return [...tenants].sort((a, b) => a.name.localeCompare(b.name));
  }, [tenants]);

  return (
    <Select
      value={activeValue}
      onChange={handleSelect}
      disabled={isLoading}
      containerClassName="min-w-0 flex-1 lg:w-64 lg:flex-initial shrink-0"
      className="bg-brand-btn-primary border-none text-white w-full text-sm font-bold rounded-xl pl-4 pr-10 h-10 outline-none shadow-md cursor-pointer hover:bg-brand-btn-primary/95 flex items-center"
      dropdownAlign="left-0 origin-top-left lg:left-auto lg:right-0 lg:origin-top-right"
      icon={dropdownIcon}
    >
      <option value="global">Global Portfolio</option>
      {sortedTenants.map((t) => (
        <option key={t.id} value={t.id}>
          {t.name}
        </option>
      ))}
    </Select>
  );
}
