import { Link, Outlet, useLocation } from "@tanstack/react-router";
import { useQueryClient } from '@tanstack/react-query';
import { RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { DashboardLayout } from "../components/common/layout/DashboardLayout.tsx";

export function Settings() {
    const queryClient = useQueryClient();
    const [isRefreshing, setIsRefreshing] = useState(false);
    const location = useLocation();
    const currentPath = location.pathname;

    const tabs = [
        { id: 'jobs', label: 'Jobs', path: '/settings/jobs' },
        { id: 'configuration', label: 'Configuration', path: '/settings/configuration' },
        { id: 'tenants', label: 'Tenants & monitors', path: '/settings/tenants' },
        { id: 'events', label: 'Health & events', path: '/settings/events' },
        { id: 'users', label: 'Users', path: '/settings/users' },
        { id: 'authentication', label: 'Authentication', path: '/settings/authentication' },
    ];

    return (
        <DashboardLayout>
            <section className="flex shrink-0 flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-4 px-2">
                    <div className="min-w-0">
                        <h1 className="m-0 text-xl font-black uppercase tracking-widest text-on-surface sm:text-2xl">
                            Settings
                        </h1>
                        <p className="m-0 mt-1 text-sm font-medium text-on-surface-variant sm:text-base">
                            Administration, integrations and system configuration
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={async () => {
                            setIsRefreshing(true);
                            await queryClient.invalidateQueries();
                            window.setTimeout(() => setIsRefreshing(false), 500);
                        }}
                        disabled={isRefreshing}
                        className="inline-flex min-h-11 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full bg-surface-container px-5 text-base font-bold text-on-surface transition-colors hover:bg-surface-container-high focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tertiary disabled:cursor-wait disabled:bg-on-surface/[0.1] disabled:text-on-surface/[0.38] disabled:hover:bg-on-surface/[0.1] disabled:hover:text-on-surface/[0.38]"
                    >
                        <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} aria-hidden="true" />
                        <span>{isRefreshing ? 'Refreshing…' : 'Refresh data'}</span>
                    </button>
                </div>
            </section>

            <div className="flex min-h-0 flex-1 gap-4">
                <main className="relative flex min-h-0 min-w-0 flex-1 flex-col">
                    <Outlet />
                </main>
                <aside className="hidden w-60 shrink-0 flex-col self-stretch rounded-2xl bg-surface p-3 m3-elevation-3 xl:flex">
                    <nav aria-label="Settings sections" className="flex flex-col gap-1">
                        {tabs.map((tab) => {
                            const isActive = currentPath.startsWith(tab.path);
                            return (
                                <Link
                                    key={tab.id}
                                    to={tab.path}
                                    aria-current={isActive ? 'page' : undefined}
                                    className={`flex min-h-12 items-center rounded-full px-5 text-sm font-bold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary ${
                                        isActive
                                            ? 'bg-primary-container text-on-primary-container'
                                            : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                                    }`}
                                >
                                    {tab.label}
                                </Link>
                            );
                        })}
                    </nav>
                </aside>
            </div>
        </DashboardLayout>
    );
}
