export interface GlobalKpi {
  currentRevenue: number;
  previousRevenue: number;
  revenueGrowthPercentage: number;
  transactionVolume: number;
  volumeGrowthPercentage: number;
  averageOrderValue: number;
  aovGrowthPercentage: number;
  activeTenants: number;
  activeTenantsGrowthPercentage: number;
  averageRevenuePerTenant: number;
  arptGrowthPercentage: number;
}

/**
 * @deprecated Use GlobalKpi instead
 */
export interface FinancialKpi extends GlobalKpi {}

export interface FinancialVelocityPoint {
  label: string;
  timestamp: string;
  currentRevenue: number;
  previousRevenue: number;
  absoluteVariance: number;
}

export interface CumulativeGrowthDeltaPoint {
  label: string;
  timestamp: string;
  currentCumulative: number;
  previousCumulative: number;
  cumulativeGrowthDelta: number;
}

export interface TransactionDensityPointDto {
  dayOfWeek: number;
  hour: number;
  count: number;
  totalRevenue: number;
}

export interface OrderBin {
  binLabel: string;
  minValue: number;
  maxValue: number;
  orderCount: number;
  cumulativePercentage: number;
  kdeDensity: number;
}

export interface GrowthExtreme {
  tenantId: string;
  tenantName: string;
  currentRevenue: number;
  previousRevenue: number;
  growthPercentage: number;
  absoluteVariance: number;
}

export interface MomentumTenant {
  tenantId: string;
  tenantName: string;
  type: string;
  baselineRevenue: number;
  growthPercentage: number;
  currentRevenue: number;
}

export interface MomentumResponse {
  medianBaselineRevenue: number;
  globalGrowthPercentage: number;
  tenants: MomentumTenant[];
}

export interface RevenueEfficiencyTenant {
  tenantId: string;
  tenantName: string;
  type: string;
  averageOrderValue: number;
  portfolioSharePercentage: number;
  growthVelocity: number;
}

export interface RevenueEfficiencyResponse {
  globalAverageOrderValue: number;
  medianPortfolioShare: number;
  tenants: RevenueEfficiencyTenant[];
}

export interface VolumeAnomalyResponseDto {
  tenantId: string;
  tenantName: string;
  volumeDeviationPercentage: number;
  currentVolume: number;
  baselineVolume: number;
}

export interface TenantDiagnostics {
  tenantId: string;
  tenantName: string;
  days: number;
  totalRevenue: number;
  totalVolume: number;
  aov: number;
  previousRevenue: number;
  previousVolume: number;
  previousAov: number;
  revenuePoP: number;
  volumePoP: number;
  aovPoP: number;
  velocity: FinancialVelocityPoint[];
  portfolioVelocity: FinancialVelocityPoint[];
  cumulativeGrowthDelta: CumulativeGrowthDeltaPoint[];
  orderDistribution: OrderBin[];
}

export interface UptimeMonitorDto {
  id: number;
  tenantId: string;
  tenantName?: string;
  name: string;
  url: string;
  updateInterval: number;
  latencyDegradedFloor: number | null;
  uptimeSla: number | null;
  currentUptimePercentage: number;
  currentLatency: number | null;
  uptimeMonitorEnabled: boolean;
  currentStatus: string;
  lastUpdate: string | null;
  lastUptimeUpdate: string | null;
  lastLatencyUpdate: string | null;
  createdDate: string;
  lastSyncError: string | null;
}

export interface AccumulatedRevenuePointDto {
  label: string;
  timestamp: string;
  currentRevenue: number;
  previousRevenue: number;
  currentAccumulated: number;
  previousAccumulated: number;
}

export interface LatencyPoint {
  label: string;
  timestamp: string;
  average: number;
  previousAverage: number;
  lowest: number;
  highest: number;
}

export interface MonitorAnalyticsDto {
  globalAverageLatency: number | null;
  latencyPoints: LatencyPoint[];
  monitors: UptimeMonitorDto[];
}

export interface TenantResponseDto {
  id: string;
  name: string;
  litiumBaseUrl: string;
  currentlyFetching: boolean;
  fetchedFrom: string | null;
  fetchedUntil: string | null;
  lastPolled: string | null;
  orderFetchingEnabled: boolean;
  monitorCount: number;
  lastSyncError: string | null;
}

export interface SystemHealthDto {
  databaseStatus: string;
  hangfire: {
    failedCount: number;
    processingCount: number;
    enqueuedCount: number;
    scheduledCount: number;
  };
  sync: {
    tenantsWithErrorsCount: number;
    monitorsWithErrorsCount: number;
    globalSyncError: string | null;
  };
  lastLitiumSync: string | null;
  lastFleetUpdate: string | null;
  lastFleetUptimeUpdate: string | null;
  lastFleetLatencyUpdate: string | null;
}
