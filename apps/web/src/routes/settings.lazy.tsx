import { createLazyFileRoute } from '@tanstack/react-router';

export const Route = createLazyFileRoute('/settings')({
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-700">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-extrabold text-brand-text tracking-tight m-0">Settings & Administration</h1>
        <p className="text-sm text-slate-500 m-0 font-medium tracking-wide">Manage tenants, monitors, and global configuration.</p>
      </header>
      
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 flex items-center justify-center min-h-[300px]">
        <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Administration features are coming soon.</p>
      </div>
    </div>
  );
}
