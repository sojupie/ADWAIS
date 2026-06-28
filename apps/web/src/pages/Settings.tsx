import { Link, Outlet, useNavigate, useLocation } from "@tanstack/react-router";
import { useQueryClient } from '@tanstack/react-query';
import { RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { DashboardLayout } from "../components/common/layout/DashboardLayout.tsx";
import { DashboardFlexRow } from "../components/common/layout/DashboardFlexRow.tsx";
import { Select } from "../components/common/ui/Select.tsx";

export function Settings() {
    const queryClient = useQueryClient();
    const [isRefreshing, setIsRefreshing] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const currentPath = location.pathname;

    const tabs = [
        { id: 'jobs', label: 'Background Jobs', path: '/settings/jobs' },
        { id: 'configuration', label: 'Configuration', path: '/settings/configuration' },
        { id: 'tenants', label: 'Tenants & Monitors', path: '/settings/tenants' },
        { id: 'events', label: 'Events & Health', path: '/settings/events' },
        { id: 'users', label: 'Users', path: '/settings/users' },
        { id: 'authentication', label: 'Authentication', path: '/settings/authentication' },
    ];

    return (
        <DashboardLayout>
            <header className="flex justify-between items-start shrink-0">
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-extrabold text-brand-text tracking-tight m-0">Settings & Administration</h1>
                    <p className="text-sm text-slate-500 m-0 font-medium tracking-wide">Manage system configuration and entities.</p>
                </div>
                <button
                    onClick={async () => {
                        setIsRefreshing(true);
                        await queryClient.invalidateQueries();
                        setTimeout(() => setIsRefreshing(false), 500);
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 hover:text-brand-accent transition-colors shadow-sm text-sm font-bold cursor-pointer"
                >
                    <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
                    <span>Refresh</span>
                </button>
            </header>

            <DashboardFlexRow weight={"flex-1"}>
                <div className="flex-1 flex flex-col min-h-0 w-full gap-2">
                    {/* Mobile Dropdown Navigation */}
                    <div className="block sm:hidden relative group shrink-0">
                        <Select
                            className="w-full bg-brand-btn-primary border-none text-white text-sm font-bold rounded-xl pl-4 pr-10 py-3.5 outline-none shadow-md cursor-pointer hover:bg-brand-btn-primary/95"
                            value={tabs.find(t => currentPath.startsWith(t.path))?.path || tabs[0].path}
                            onChange={(e) => navigate({ to: e.target.value })}
                            icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white/70"><path d="m6 9 6 6 6-6" /></svg>}
                        >
                            {tabs.map(t => (
                                <option key={t.id} value={t.path}>{t.label}</option>
                            ))}
                        </Select>
                    </div>

                    {/* Desktop Pill Navigation */}
                    <div className="hidden sm:flex flex-wrap gap-2 shrink-0">
                        {tabs.map((t) => {
                            const isActive = currentPath.startsWith(t.path);
                            return (
                                <Link
                                    key={t.id}
                                    to={t.path}
                                    className={`px-5 py-2.5 text-sm font-bold tracking-wide transition-all rounded-xl ${isActive ? 'bg-brand-btn-primary text-white shadow-md' : 'text-slate-500 hover:text-slate-800 hover:bg-brand-btn-primary/10 hover:shadow-sm'}`}
                                >
                                    {t.label}
                                </Link>
                            );
                        })}
                    </div>

                    <div className="flex-1 min-h-0 relative flex flex-col">
                        <Outlet />
                    </div>
                </div>
            </DashboardFlexRow>
        </DashboardLayout>
    );
}
