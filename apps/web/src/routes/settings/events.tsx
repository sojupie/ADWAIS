import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { HeartPulse, TerminalSquare, AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { apiFetch } from '../../apiClient';

export const Route = createFileRoute('/settings/events')({
  component: SystemEventsView,
});

function SystemEventsView() {
  const { data: health } = useQuery({
    queryKey: ['system-health'],
    queryFn: () => apiFetch<any>('/api/system/health'),
    refetchInterval: 30000
  });

  const { data: events } = useQuery({
    queryKey: ['system-events'],
    queryFn: () => apiFetch<any[]>('/api/SystemEvent?take=30'),
    refetchInterval: 30000
  });

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 h-[calc(100vh-250px)] min-h-[500px]">
      <section className="flex flex-col h-full col-span-1 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between shrink-0 p-4 bg-brand-bg-secondary border-b border-slate-200 shadow-sm z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 text-white rounded-lg shadow-sm">
              <HeartPulse size={24} />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-white">Pipeline Health</h2>
              <p className="text-xs font-semibold text-slate-300">Live connectivity</p>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 custom-scrollbar bg-slate-50/50">
        
        {health ? (
          <div className="flex flex-col gap-3">
             {Object.entries(health).map(([key, value]: any) => (
               <div key={key} className="flex items-center justify-between p-3 border border-slate-100 rounded-xl bg-slate-50">
                 <span className="text-sm font-bold text-slate-700">{key}</span>
                 {value === 'Healthy' ? (
                   <span className="flex items-center gap-1.5 px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold border border-green-200">
                     <CheckCircle2 size={14} /> OK
                   </span>
                 ) : (
                   <span className="flex items-center gap-1.5 px-2.5 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold border border-red-200">
                     <AlertCircle size={14} /> ERR
                   </span>
                 )}
               </div>
             ))}
          </div>
        ) : (
          <div className="animate-pulse flex flex-col gap-3">
            <div className="h-12 bg-slate-100 rounded-xl"></div>
            <div className="h-12 bg-slate-100 rounded-xl"></div>
            <div className="h-12 bg-slate-100 rounded-xl"></div>
          </div>
        )}
        </div>
      </section>

      <section className="flex flex-col h-full col-span-1 xl:col-span-2 bg-slate-900 rounded-2xl shadow-lg border border-slate-800 overflow-hidden">
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
          {(events || []).map((e: any, i: number) => {
            const isError = e.level === 'Error';
            const isWarn = e.level === 'Warning';
            return (
              <div key={i} className="flex items-start gap-4 p-2 rounded hover:bg-white/5 transition-colors group">
                <span className="text-slate-500 shrink-0 mt-0.5 text-xs">
                  {new Date(e.timestamp).toLocaleTimeString([], { hour12: false })}
                </span>
                <div className="flex flex-col gap-1 w-full">
                  <div className="flex items-center gap-2">
                    {isError ? <AlertCircle size={14} className="text-red-400" /> : 
                     isWarn ? <AlertCircle size={14} className="text-amber-400" /> : 
                     <Info size={14} className="text-blue-400" />}
                    <span className={`font-bold text-xs ${isError ? 'text-red-400' : isWarn ? 'text-amber-400' : 'text-blue-400'}`}>
                      [{e.level.toUpperCase()}]
                    </span>
                    <span className="text-slate-300 break-words">{e.message}</span>
                  </div>
                  {e.exception && (
                    <div className="mt-2 p-3 bg-red-950/30 border border-red-900/50 rounded text-red-200/80 text-xs overflow-x-auto">
                      <pre className="whitespace-pre-wrap">{e.exception}</pre>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
