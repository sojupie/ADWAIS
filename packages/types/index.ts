// Shared TypeScript contracts mirroring C# backend models

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

export interface TenantKpi {
  tenantId: string;
  tenantName: string;
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

export interface DailyGlobalRollup {
  createdDate: string; // ISO date string
  globalVolume: number;
  globalRevenue: number;
}

export interface DailyTenantRollup {
  createdDate: string;
  tenantId: string;
  volume: number;
  revenue: number;
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
