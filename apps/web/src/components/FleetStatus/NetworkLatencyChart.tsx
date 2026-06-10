import {
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Line,
  LineChart,
} from 'recharts';

export interface LatencyPoint {
  label: string;
  timestamp: string;
  average: number;
  previousAverage: number;
  lowest: number;
  highest: number;
}

function formatLatency(value: number): string {
  return `${Math.round(value)}ms`;
}

interface GraphTooltipProps {
  isLoading?: boolean;
  active?: boolean;
  label?: string;
  payload?: Array<{ payload: LatencyPoint, name: string, color: string }>;
}

const GraphTooltip = ({ active, payload, label }: GraphTooltipProps) => {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload as LatencyPoint;

  return (
    <div className="bg-white border border-slate-100 rounded-lg shadow-lg p-4 text-sm animate-in fade-in zoom-in duration-200">
      <p className="font-bold text-brand-text mb-3 border-b border-slate-50 pb-2 uppercase tracking-widest text-xs">{label}</p>
      <div className="space-y-2">
        <p className="flex justify-between gap-8">
          <span className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Current Avg</span> 
          <strong className="text-brand-btn-primary">{formatLatency(point.average)}</strong>
        </p>
        <p className="flex justify-between gap-8">
          <span className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Previous Avg</span> 
          <strong className="text-slate-500">{formatLatency(point.previousAverage)}</strong>
        </p>
        <div className="pt-2 border-t border-slate-50 mt-2 space-y-1">
          <p className="flex justify-between gap-8">
            <span className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Highest</span> 
            <strong className="text-red-500 text-xs">{formatLatency(point.highest)}</strong>
          </p>
          <p className="flex justify-between gap-8">
            <span className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Lowest</span> 
            <strong className="text-emerald-500 text-xs">{formatLatency(point.lowest)}</strong>
          </p>
        </div>
      </div>
    </div>
  );
};

import { ChartSkeleton } from '../common/charts/ChartSkeleton';
import { EmptyState } from '../common/ui/EmptyState';

export function NetworkLatencyChart({ isLoading, points, title = "Network Latency", className }: { isLoading?: boolean; points: LatencyPoint[], title?: string, className?: string }) {
  if (isLoading) {
    return <ChartSkeleton />;
  }

  return (
      <div className={`w-full h-full flex-1 min-h-0 flex flex-col ${className || ''}`}>
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-sm font-black text-slate-500 uppercase tracking-[0.15em]">{title}</h2>
          <div className="flex gap-6 text-[11px] font-black text-slate-500 uppercase tracking-widest bg-slate-50 px-4 py-2 rounded-full border border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-brand-btn-primary"></div>
              <span>Current</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full border-2 border-slate-300 border-dashed bg-transparent"></div>
              <span>Previous</span>
            </div>
          </div>
        </div>
        
        <div className="flex-1 w-full min-h-0">
          {points.length === 0 ? (
            <EmptyState message="No latency data available" variant="minimal" />
          ) : (
            <ResponsiveContainer width="100%" height="100%" debounce={100}>
              <LineChart data={points} margin={{ top: 10, right: 20, left: -5, bottom: 10 }}>
                <CartesianGrid vertical={false} stroke="var(--color-chart-grid)" strokeDasharray="3 3" />
                <XAxis 
                  dataKey="label" 
                  fontSize={12} 
                  tick={{ fill: 'var(--color-chart-tick)', fontWeight: 700, fontFamily: 'Manrope, sans-serif' }} 
                  tickMargin={15} 
                  axisLine={false} 
                  tickLine={false} 
                />
                <YAxis 
                  fontSize={12} 
                  tick={{ fill: 'var(--color-chart-tick)', fontWeight: 700, fontFamily: 'Manrope, sans-serif' }} 
                  axisLine={false} 
                  tickLine={false}
                  tickFormatter={(v) => `${v}ms`}
                />
                <Tooltip content={<GraphTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="previousAverage" 
                  name="Previous Period" 
                  stroke="var(--color-chart-prev-line)" 
                  strokeWidth={2} 
                  strokeDasharray="6 6" 
                  dot={false}
                  activeDot={false}
                  
                />
                <Line 
                  type="monotone" 
                  dataKey="average" 
                  name="Current Period" 
                  stroke="var(--color-brand-btn-primary)" 
                  strokeWidth={4} 
                  dot={false}
                  activeDot={{ r: 6, fill: 'var(--color-brand-btn-primary)', stroke: '#fff', strokeWidth: 3 }} 
                  
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
  );
}
