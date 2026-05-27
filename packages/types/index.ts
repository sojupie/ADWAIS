export interface GlobalKpi {
  currentRevenue: number;
  previousRevenue: number;
  revenueGrowthPercentage: number;
  transactionVolume: number;
  averageOrderValue: number;
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
  cumulativeGrowthDelta: number;
}

export interface OrderBin {
  binLabel: string;
  binMin: number;
  binMax: number;
  orderCount: number;
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
  baselineRevenue: number;
  growthPercentage: number;
  currentRevenue: number;
}

export interface MomentumResponse {
  medianBaselineRevenue: number;
  tenants: MomentumTenant[];
}

export interface DistributionEntry {
  tenantId: string | null;
  tenantName: string;
  absoluteRevenue: number;
  cumulativePortfolioShare: number;
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
