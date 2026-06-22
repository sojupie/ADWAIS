import { useState } from 'react';
import { HeartPulse, TerminalSquare, AlertCircle, CheckCircle2, AlertTriangle, Info, Check, Copy } from 'lucide-react';
import { SettingsPanel } from '../../components/common/layout/SettingsPanel';
import { SectionHeader } from '../../components/common/layout/SectionHeader';
import { SecureButton } from '../../components/common/ui/SecureButton';
import { Skeleton } from '../../components/common/ui/Skeleton';
import { useSystemEventsViewModel, type SystemEvent } from '../../hooks/useSystemEventsViewModel';

function timeAgo(date: string | number | null | undefined): string {
    if (!date) return 'Never';
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds < 5) return 'Just now';
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
}

import { Card } from '../../components/common/ui/Card';

interface HealthStatusCardProps {
    title: string;
    subtitle: string;
    status: 'Healthy' | 'Degraded' | 'Failed' | 'Warning' | string;
    children?: React.ReactNode;
}

function HealthStatusCard({ title, subtitle, status, children }: HealthStatusCardProps) {
    const isHealthy = status === 'Healthy' || status === 'OK';
    const isWarning = status === 'Degraded' || status === 'Warning';
    const isFailed = status === 'Failed' || status === 'Error' || status === 'Critical';

    return (
        <Card className="flex flex-col p-3 gap-2">
            <div className="flex items-center justify-between">
                <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-800">{title}</span>
                    <span className="text-sm text-slate-400">{subtitle}</span>
                </div>
                {isHealthy && (
                    <span className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-700 rounded-full text-sm font-bold border border-green-200">
                        <CheckCircle2 size={13} /> OK
                    </span>
                )}
                {isWarning && (
                    <span className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full text-sm font-bold border border-amber-200">
                        <AlertTriangle size={13} /> WARN
                    </span>
                )}
                {isFailed && (
                    <span className="flex items-center gap-1.5 px-2.5 py-1 bg-red-50 text-red-700 rounded-full text-sm font-bold border border-red-200">
                        <AlertCircle size={13} /> ERR
                    </span>
                )}
            </div>
            {children}
        </Card>
    );
}

export function SystemEventsView() {
    const {
        isAdmin,
        health,
        events,
        clearErrorsMutation
    } = useSystemEventsViewModel();
    return (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 h-full min-h-0">

            {/* Diagnostics / Health Panel */}
            <SettingsPanel className="col-span-1">
                <SectionHeader
                    title="Pipeline Health"
                    subtitle="Live connectivity"
                    icon={<HeartPulse size={24} />}
                    dark={true}
                />

                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5 custom-scrollbar bg-white rounded-xl shadow-sm border border-slate-200/60">
                    {health ? (
                        <div className="flex flex-col gap-4">

                            {/* Database Health Card */}
                            <HealthStatusCard
                                title="Database Status"
                                subtitle="Core database connection"
                                status={health.databaseStatus}
                            />

                            {/* Sync Pipeline Health Card */}
                            <HealthStatusCard
                                title="Sync Status"
                                subtitle="Monitoring & order ingestion"
                                status={health.sync?.status}
                            >
                                <div className="grid grid-cols-2 gap-2 mt-1 text-sm border-t border-slate-100 pt-2 text-slate-500">
                                    <div>Tenants with errors: <span className="font-bold text-slate-800">{health.sync?.tenantsWithErrorsCount}</span></div>
                                    <div>Monitors with errors: <span className="font-bold text-slate-800">{health.sync?.monitorsWithErrorsCount}</span></div>
                                </div>
                                {health.sync?.globalSyncError && (
                                    <div className="mt-1 p-2 bg-red-50 text-red-800 border border-red-100 rounded text-sm leading-tight font-medium">
                                        {health.sync.globalSyncError}
                                    </div>
                                )}
                            </HealthStatusCard>

                            {/* Hangfire Background Health Card */}
                            <HealthStatusCard
                                title="Hangfire Status"
                                subtitle="Scheduler worker queues"
                                status={health.hangfire?.status}
                            >
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2 text-center border-t border-slate-100 pt-3 text-sm text-slate-500">
                                    <div className="flex flex-col p-1.5 bg-slate-50 rounded">
                                        <span className="font-extrabold text-slate-850">{health.hangfire?.processingCount}</span>
                                        <span>Active</span>
                                    </div>
                                    <div className="flex flex-col p-1.5 bg-slate-50 rounded">
                                        <span className="font-extrabold text-slate-850">{health.hangfire?.enqueuedCount}</span>
                                        <span>Queued</span>
                                    </div>
                                    <div className="flex flex-col p-1.5 bg-slate-50 rounded">
                                        <span className="font-extrabold text-slate-850">{health.hangfire?.scheduledCount}</span>
                                        <span>Scheduled</span>
                                    </div>
                                    <div className="flex flex-col p-1.5 bg-slate-50 rounded">
                                        <span className={`font-extrabold ${health.hangfire?.failedCount > 0 ? 'text-red-650' : 'text-slate-850'}`}>{health.hangfire?.failedCount}</span>
                                        <span>Failed</span>
                                    </div>
                                </div>
                            </HealthStatusCard>

                            {/* Clear Errors Action */}
                            <SecureButton
                                onClick={() => clearErrorsMutation.mutate()}
                                locked={!isAdmin}
                                lockTitle="Requires Admin privileges"
                                loading={clearErrorsMutation.isPending}
                                loadingText="Clearing Diagnostics..."
                                className="w-full py-2.5 px-4 bg-slate-150 hover:bg-slate-200 active:bg-slate-250 text-slate-700 font-bold rounded-xl text-sm shadow-sm transition-colors border border-slate-250 cursor-pointer flex items-center justify-center gap-2"
                            >
                                Clear Sync Errors
                            </SecureButton>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4">
                            <Skeleton.Card className="h-16" />
                            <Skeleton.Card className="h-28" />
                            <Skeleton.Card className="h-28" />
                        </div>
                    )}

                    {/* Sync Dates Section */}
                    {health && (
                        <div className="flex flex-col border border-slate-200 rounded-xl bg-white shadow-sm overflow-hidden">
                            <div className="p-3 bg-slate-50 border-b border-slate-200 font-bold text-sm text-slate-400 uppercase tracking-widest">
                                Last Successful Syncs
                            </div>
                            <div className="flex flex-col divide-y divide-slate-100 text-sm">
                                <div className="flex justify-between items-center p-3">
                                    <span className="font-semibold text-slate-600">Litium Ingestion</span>
                                    <span className="font-bold text-slate-800">{timeAgo(health.lastLitiumSync)}</span>
                                </div>
                                <div className="flex justify-between items-center p-3">
                                    <span className="font-semibold text-slate-600">Fleet Meta Update</span>
                                    <span className="font-bold text-slate-800">{timeAgo(health.lastFleetUpdate)}</span>
                                </div>
                                <div className="flex justify-between items-center p-3">
                                    <span className="font-semibold text-slate-600">Uptimerobot Sync</span>
                                    <span className="font-bold text-slate-800">{timeAgo(health.lastFleetUptimeUpdate)}</span>
                                </div>
                                <div className="flex justify-between items-center p-3">
                                    <span className="font-semibold text-slate-600">Latencyrobot Sync</span>
                                    <span className="font-bold text-slate-800">{timeAgo(health.lastFleetLatencyUpdate)}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </SettingsPanel>

            {/* System Logs console */}
            <section className="flex flex-col col-span-1 xl:col-span-2 bg-slate-900 rounded-2xl shadow-lg border border-slate-800 overflow-hidden h-full min-h-0 max-h-[500px] sm:max-h-[800px] xl:max-h-[calc(100vh-230px)] min-w-[285px] sm:min-w-[320px] min-w-0">
                <div className="flex items-center justify-between shrink-0 p-4 border-b border-slate-800 bg-slate-900 z-10">
                    <div className="flex items-center gap-3">
                        <TerminalSquare size={18} className="text-brand-accent" />
                        <h2 className="text-sm font-bold text-white tracking-wider">SYSTEM LOGS</h2>
                    </div>
                    <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-slate-700"></div>
                        <div className="w-3 h-3 rounded-full bg-slate-700"></div>
                        <div className="w-3 h-3 rounded-full bg-slate-700"></div>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar flex flex-col gap-2 bg-[#0d1117] font-mono text-sm">
                    {(events || []).map((e: SystemEvent, i: number) => (
                        <LogEventRow key={e.id || i} e={e} />
                    ))}
                </div>
            </section>
        </div>
    );
}

function LogEventRow({ e }: { e: SystemEvent }) {
    const [copied, setCopied] = useState(false);
    const isError = e.level === 'Error';
    const isWarn = e.level === 'Warning';

    let displayMessage = e.message;
    if (e.tenant && e.tenant.name) {
        const tenantIdStr = String(e.tenant.id || e.tenantId);
        const regex = new RegExp(tenantIdStr, 'gi');
        displayMessage = displayMessage.replace(regex, e.tenant.name);
    }

    const handleCopy = () => {
        const time = new Date(e.timestamp).toLocaleTimeString([], { hour12: false });
        const levelStr = `[${(e.level || 'info').toUpperCase()}]`;
        const fullText = `${time} ${levelStr} ${displayMessage}${e.exception ? `\nException: ${e.exception}` : ''}`;

        navigator.clipboard.writeText(fullText).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <div className="flex items-start gap-4 p-1.5 rounded hover:bg-white/5 transition-colors group text-slate-300 relative">
            <span className="text-slate-500 shrink-0 mt-0.5 text-sm">
                {new Date(e.timestamp).toLocaleTimeString([], { hour12: false })}
            </span>
            <div className="flex flex-col gap-1 w-full min-w-0">
                <div className="flex items-center gap-2 pr-8">
                    {isError ? <AlertCircle size={13} className="text-red-400 shrink-0" /> :
                        isWarn ? <AlertTriangle size={13} className="text-amber-455 shrink-0" /> :
                            <Info size={13} className="text-blue-400 shrink-0" />}
                    <span className={`font-bold text-sm shrink-0 ${isError ? 'text-red-400' : isWarn ? 'text-amber-455' : 'text-blue-400'}`}>
                        [{(e.level || 'info').toUpperCase()}]
                    </span>
                    <span className="break-words leading-tight text-slate-200 select-text">{displayMessage}</span>
                </div>
                {e.exception && (
                    <div className="mt-1.5 p-2 bg-red-950/30 border border-red-900/50 rounded text-red-200/80 text-sm overflow-x-auto custom-scrollbar select-text">
                        <pre className="whitespace-pre-wrap">{e.exception}</pre>
                    </div>
                )}
            </div>

            {/* Copy Button (visible on hover) */}
            <button
                onClick={handleCopy}
                className="absolute right-2 top-2 p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity duration-150 cursor-pointer"
                title="Copy full log entry"
            >
                {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
            </button>
        </div>
    );
}
