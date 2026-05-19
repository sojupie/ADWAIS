import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { TenantDiagnostics as TenantDiagnosticsData } from '@types';
import { formatCompact, formatCurrency, formatNumber } from '@utils';
import { ChartPanel } from '../components/common/ChartPanel';
import { FactPanel } from '../components/common/FactPanel';
import './TenantDiagnostics.css';

interface Props {
  data: TenantDiagnosticsData;
  onBack: () => void;
}

interface DailyChartRow {
  day: string;
  revenue: number;
  previousRevenue: number;
  portfolioShare: number;
  cumulativeDelta: number;
}

function buildDailyRows(data: TenantDiagnosticsData): DailyChartRow[] {
  let currentCumulative = 0;
  let previousCumulative = 0;

  return data.daily.map((point) => {
    currentCumulative += point.revenue;
    previousCumulative += point.previousRevenue;

    return {
      day: `Day ${point.dayIndex}`,
      revenue: point.revenue,
      previousRevenue: point.previousRevenue,
      portfolioShare: point.portfolioShare,
      cumulativeDelta: currentCumulative - previousCumulative,
    };
  });
}

const RevenueTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="chart-panel-tooltip">
      <p className="chart-panel-tooltip__label">{label}</p>
      {payload.map((entry: any) => (
        <p key={entry.dataKey} style={{ color: entry.color }}>
          {entry.dataKey === 'revenue' ? 'Current' : 'Previous'}:{' '}
          <strong>{formatCompact(entry.value)} SEK</strong>
        </p>
      ))}
    </div>
  );
};

const ShareTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="chart-panel-tooltip">
      <p className="chart-panel-tooltip__label">{label}</p>
      <p>Share: <strong>{payload[0].value.toFixed(2)}%</strong></p>
    </div>
  );
};

const DeltaTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="chart-panel-tooltip">
      <p className="chart-panel-tooltip__label">{label}</p>
      <p>Delta: <strong>{formatCompact(payload[0].value)} SEK</strong></p>
    </div>
  );
};

const DistributionTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="chart-panel-tooltip">
      <p className="chart-panel-tooltip__label">{label} SEK</p>
      <p>Orders: <strong>{formatNumber(payload[0].value)}</strong></p>
    </div>
  );
};

export function TenantDiagnostics({ data, onBack }: Props) {
  const dailyRows = buildDailyRows(data);
  const growthColor = data.revenuePoP > 0 ? 'green' : data.revenuePoP < 0 ? 'red' : undefined;

  return (
    <div className="tenant-diagnostics">
      <header className="tenant-diagnostics__header">
        <button
          className="tenant-diagnostics__back"
          type="button"
          onClick={onBack}
          aria-label="Back to financial overview"
        >
          &lt;
        </button>
        <div>
          <h1>{data.tenantName} Diagnostics</h1>
          <p>Isolated entity performance view.</p>
        </div>
      </header>

      <section className="tenant-diagnostics__kpis" aria-label="Tenant key performance indicators">
        <FactPanel
          label={`Revenue (T${data.days})`}
          value={formatCurrency(data.totalRevenue)}
        />
        <FactPanel
          label={`Growth (vs P${data.days})`}
          value={`${data.revenuePoP >= 0 ? '+' : ''}${data.revenuePoP.toFixed(2)}%`}
          valueColor={growthColor}
        />
        <FactPanel
          label="Transaction Volume"
          value={formatNumber(data.totalVolume)}
        />
        <FactPanel
          label="Average Order Value"
          value={formatCurrency(data.aov)}
        />
      </section>

      <section className="tenant-diagnostics__charts tenant-diagnostics__charts--primary" aria-label="Tenant revenue diagnostics">
        <ChartPanel title="Revenue Velocity Over Time">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailyRows} margin={{ top: 8, right: 10, left: 8, bottom: 20 }}>
              <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 4" vertical={false} />
              <XAxis dataKey="day" tick={{ fill: 'var(--text-primary)', fontSize: 10 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis tickFormatter={(value) => formatCompact(value)} tick={{ fill: 'var(--text-primary)', fontSize: 10 }} axisLine={false} tickLine={false} width={56} />
              <Tooltip content={<RevenueTooltip />} />
              <Line type="monotone" dataKey="previousRevenue" stroke="var(--chart-ghost)" strokeWidth={2} strokeDasharray="5 5" dot={false} />
              <Line type="monotone" dataKey="revenue" stroke="var(--chart-line)" strokeWidth={2.4} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartPanel>

        <ChartPanel title="Portfolio Revenue Share Trajectory">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={dailyRows} margin={{ top: 8, right: 10, left: 8, bottom: 20 }}>
              <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 4" vertical={false} />
              <XAxis dataKey="day" tick={{ fill: 'var(--text-primary)', fontSize: 10 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis tickFormatter={(value) => `${value.toFixed(2)}%`} tick={{ fill: 'var(--text-primary)', fontSize: 10 }} axisLine={false} tickLine={false} width={56} domain={['dataMin', 'dataMax']} />
              <Tooltip content={<ShareTooltip />} />
              <Area type="monotone" dataKey="portfolioShare" stroke="var(--chart-line)" strokeWidth={1.8} fill="var(--chart-line)" fillOpacity={0.16} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartPanel>
      </section>

      <section className="tenant-diagnostics__charts" aria-label="Tenant order diagnostics">
        <ChartPanel title="Cumulative Growth Delta (Absolute)">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailyRows} margin={{ top: 8, right: 10, left: 8, bottom: 20 }}>
              <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 4" vertical={false} />
              <XAxis dataKey="day" tick={{ fill: 'var(--text-primary)', fontSize: 10 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis tickFormatter={(value) => formatCompact(value)} tick={{ fill: 'var(--text-primary)', fontSize: 10 }} axisLine={false} tickLine={false} width={56} />
              <Tooltip content={<DeltaTooltip />} />
              <Line type="stepAfter" dataKey="cumulativeDelta" stroke="var(--green)" strokeWidth={2.4} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartPanel>

        <ChartPanel title="Order Value Distribution">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.orderValueDistribution} margin={{ top: 8, right: 10, left: 8, bottom: 42 }}>
              <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 4" vertical={false} />
              <XAxis dataKey="range" tick={{ fill: 'var(--text-primary)', fontSize: 10 }} axisLine={false} tickLine={false} angle={-45} textAnchor="end" height={58} interval={0} />
              <YAxis tick={{ fill: 'var(--text-primary)', fontSize: 10 }} axisLine={false} tickLine={false} width={46} />
              <Tooltip content={<DistributionTooltip />} />
              <Bar dataKey="orderCount" fill="var(--chart-line)" fillOpacity={0.84} radius={[5, 5, 0, 0]} maxBarSize={60} />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>
      </section>
    </div>
  );
}
