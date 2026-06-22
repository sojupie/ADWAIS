import * as Generated from './generated';

export type ComparisonPeriod = Generated.ComparisonType;
export type GlobalKpi = Required<Generated.KpiResponseDto>;
export type FinancialKpi = GlobalKpi; // Deprecated but maps to KpiResponseDto
export type FinancialVelocityPoint = Required<Generated.VelocityPointResponseDto>;
export type CumulativeGrowthDeltaPoint = Required<Generated.CumulativeGrowthDeltaPointResponseDto>;
export type TransactionDensityPointDto = Required<Generated.TransactionDensityPointResponseDto>;

export type OrderBin = Required<Omit<Generated.OrderBinResponseDto, 'binLabel'>> & {
  binLabel: string;
};

export type GrowthExtreme = Required<Omit<Generated.GrowthExtremeResponseDto, 'tenantName'>> & {
  tenantName: string;
};

export type MomentumTenant = Required<Omit<Generated.MomentumTenantResponseDto, 'tenantName'>> & {
  tenantName: string;
};

export type MomentumResponse = Required<Omit<Generated.MomentumResponseDto, 'tenants'>> & {
  tenants: MomentumTenant[];
};

export type RevenueEfficiencyTenant = Required<Omit<Generated.RevenueEfficiencyTenantResponseDto, 'tenantName'>> & {
  tenantName: string;
};

export type RevenueEfficiencyResponse = Required<Omit<Generated.RevenueEfficiencyResponseDto, 'tenants'>> & {
  tenants: RevenueEfficiencyTenant[];
};

export type VolumeAnomalyResponseDto = Required<Omit<Generated.VolumeAnomalyResponseDto, 'tenantName'>> & {
  tenantName: string;
};

export type UptimeMonitorDto = {
  id: number;
  tenantId: string;
  tenantName?: string;
  name: string;
  url: string;
  updateInterval: number;
  latencyDegradedFloor: number | null;
  uptimeSla: number | null;
  currentUptimePercentage: number | null;
  currentLatency: number | null;
  uptimeMonitorEnabled: boolean;
  currentStatus: string;
  lastUpdate: string | null;
  lastUptimeUpdate: string | null;
  lastLatencyUpdate: string | null;
  createdDate: string;
  lastSyncError: string | null;
  tags?: string[] | null;
};

export type TenantResponseDto = {
  id: string;
  name: string;
  type: Generated.TenantType;
  litiumBaseUrl: string;
  currentlyFetching: boolean;
  fetchedFrom: string | null;
  fetchedUntil: string | null;
  lastPolled: string | null;
  orderFetchingEnabled: boolean;
  monitorCount: number;
  lastSyncError: string | null;
  hasServiceAccountToken: boolean;
};

export type SystemHealthDto = {
  databaseStatus: string;
  hangfire: Required<Omit<Generated.HangfireHealthDto, 'status'>> & { status: string };
  sync: Required<Omit<Generated.SyncHealthDto, 'status' | 'globalSyncError'>> & { status: string; globalSyncError: string | null };
  lastLitiumSync: string | null;
  lastFleetUpdate: string | null;
  lastFleetUptimeUpdate: string | null;
  lastFleetLatencyUpdate: string | null;
};

export type BackgroundJobStatusDto = Required<Omit<Generated.BackgroundJobStatusDto, 'jobId' | 'jobName' | 'jobArgs' | 'state' | 'createdAt' | 'durationSeconds' | 'exceptionMessage'>> & {
  jobId: string;
  jobName: string;
  jobArgs: string | null;
  state: string;
  createdAt: string | null;
  durationSeconds: number | null;
  exceptionMessage: string | null;
};

export type UserResponseDto = {
  id: string;
  name: string;
  email: string | null;
  role: string;
};

export type GlobalConfigDto = Required<Omit<Generated.GlobalConfigResponseDto, 'lastPolled' | 'latencyDegradedFloor' | 'uptimeRobotApiKey' | 'monitorsCount' | 'monitorsLimit' | 'activeSubscription' | 'defaultUptimeSla'>> & {
  lastPolled: string | null;
  latencyDegradedFloor?: number | null;
  uptimeRobotApiKey?: string | null;
  monitorsCount?: number | null;
  monitorsLimit?: number | null;
  activeSubscription?: string | null;
  defaultUptimeSla?: number | null;
  retentionDays: number;
  lastSyncError: string | null;
};

// Added back for compatibility
export type AccumulatedRevenuePointDto = Required<Generated.AccumulatedRevenuePointResponseDto>;
export type LatencyPoint = Required<Generated.LatencyPointResponseDto>;
export type MonitorAnalyticsDto = Required<Omit<Generated.MonitorAnalyticsResponseDto, 'latencyPoints' | 'monitors' | 'globalAverageLatency'>> & {
  globalAverageLatency: number | null;
  latencyPoints: LatencyPoint[];
  monitors: UptimeMonitorDto[];
};

// Keeping original because it's returned as an anonymous object from Hangfire endpoints
// and is not generated in the OpenAPI specs.
export interface RecurringJobDto {
  id: string;
  cron: string;
  nextExecution: string | null;
  lastExecution: string | null;
  lastJobState: string | null;
  lastJobDuration: number | null;
}

export * from './generated';
