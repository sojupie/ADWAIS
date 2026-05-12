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
