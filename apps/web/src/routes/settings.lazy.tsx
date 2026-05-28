import { createLazyFileRoute, Link, Outlet } from '@tanstack/react-router';

export const Route = createLazyFileRoute('/settings')({
  component: SettingsLayout,
});

function SettingsLayout() {
  const tabs = [
    { id: 'jobs', label: 'Background Jobs', path: '/settings/jobs' },
    { id: 'tenants', label: 'Tenants & Monitors', path: '/settings/tenants' },
    { id: 'events', label: 'Events & Health', path: '/settings/events' },
    { id: 'users', label: 'Users', path: '/settings/users' },
  ];

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-700">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-extrabold text-brand-text tracking-tight m-0">Settings & Administration</h1>
        <p className="text-sm text-slate-500 m-0 font-medium tracking-wide">Manage system configuration and entities.</p>
      </header>
      
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 min-h-[500px]">
        <div className="flex border-b border-slate-200 mb-6 gap-6">
          {tabs.map((t) => (
            <Link
              key={t.id}
              to={t.path}
              className="pb-2 text-sm font-bold tracking-wider uppercase transition-colors text-slate-500 hover:text-slate-800"
              activeProps={{ className: '!text-brand-accent border-b-2 !border-brand-accent' }}
            >
              {t.label}
            </Link>
          ))}
        </div>
        <div className="mt-4">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
