import { Link, Outlet } from "@tanstack/react-router";
import { useQueryClient } from '@tanstack/react-query';
import { RefreshCw } from 'lucide-react';
import { useState } from 'react';
import {DashboardLayout} from "../components/common/layout/DashboardLayout.tsx";
import {DashboardFlexRow} from "../components/common/layout/DashboardFlexRow.tsx";

import { useCurrentUser } from "../hooks/useCurrentUser";

export function Settings() {
    const queryClient = useQueryClient();
    const [isRefreshing, setIsRefreshing] = useState(false);
    const { role } = useCurrentUser();

    const tabs = [
        { id: 'jobs', label: 'Background Jobs', path: '/settings/jobs' },
        { id: 'tenants', label: 'Tenants & Monitors', path: '/settings/tenants' },
        { id: 'events', label: 'Events & Health', path: '/settings/events' },
        ...(role === 'Admin' ? [{ id: 'users', label: 'Users', path: '/settings/users' }] : []),
        { id: 'kiosks', label: 'Kiosks', path: '/settings/kiosks' },
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
                    Refresh
                </button>
            </header>

            <DashboardFlexRow weight={"flex-1"}>
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex-1 flex flex-col min-h-0">
                    <div className="flex flex-wrap border-b border-slate-200 mb-4 gap-x-6 gap-y-2 shrink-0">
                        {tabs.map((t) => (
                            <Link
                                key={t.id}
                                to={t.path}
                                className="pb-2 text-sm font-bold tracking-wider uppercase transition-colors text-slate-500 hover:text-slate-800 whitespace-nowrap"
                                activeProps={{ className: '!text-brand-link border-b-2 !border-brand-link' }}
                            >
                                {t.label}
                            </Link>
                        ))}
                    </div>
                    <div className="mt-4 flex-1 min-h-0 relative">
                        <Outlet />
                    </div>
                </div>
            </DashboardFlexRow>
        </DashboardLayout>
    );
}
