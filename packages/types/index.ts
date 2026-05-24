export interface GlobalKpi {
  totalRevenue: number;
  totalVolume: number;
  aov: number;
  previousRevenue: number;
  previousVolume: number;
  previousAov: number;
  revenuePoP: number;
  volumePoP: number;
  aovPoP: number;
}

export interface FinancialKpi {
  currentRevenue: number;
  previousRevenue: number;
  revenueGrowthPercentage: number;
  transactionVolume: number;
  averageOrderValue: number;
}

export interface FinancialVelocityPoint {
  periodLabel: string;
  currentRevenue: number;
  previousRevenue: number;
  absoluteVariance: number;
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
  daily: TenantDiagnosticDailyPoint[];
  orderValueDistribution: OrderValueBucket[];
}

export interface TenantDiagnosticDailyPoint {
  createdDate: string;
  dayIndex: number;
  revenue: number;
  volume: number;
  previousRevenue: number;
  globalRevenue: number;
  portfolioShare: number;
}

export interface OrderValueBucket {
  range: string;
  minValue: number;
  maxValue: number;
  orderCount: number;
}
