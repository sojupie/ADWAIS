import type { 
  AccumulatedRevenuePointDto, 
  MomentumResponse, 
  RevenueEfficiencyResponse, 
  TransactionDensityPointResponseDto,
  TransactionDensityResponseDto,
  VolumeAnomalyResponseDto 
} from '@types';

export const MOCK_ACCUMULATED_REVENUE: AccumulatedRevenuePointDto[] = Array.from({ length: 30 }).map((_, i) => ({
  timestamp: new Date(Date.now() - (29 - i) * 86400000).toISOString(),
  currentRevenue: 2000000 + Math.random() * 6000000,
  previousRevenue: 1800000 + Math.random() * 5500000,
  currentAccumulated: (i + 1) * 2500000 + (Math.random() * 500000),
  previousAccumulated: (i + 1) * 2200000 + (Math.random() * 500000),
}));

export const MOCK_MOMENTUM: MomentumResponse = {
  globalGrowthPercentage: 15.2,
  medianBaselineRevenue: 4500000,
  tenants: Array.from({ length: 45 }).map((_, i) => ({
    tenantId: `t-${i}`,
    tenantName: `Mock Store ${i + 1}`,
    baselineRevenue: 1000000 + Math.random() * 8000000,
    growthPercentage: -15 + Math.random() * 35,
    currentRevenue: 1100000 + Math.random() * 9000000,
    orderVolume: 5000 + Math.random() * 20000,
    previousRevenue: 1000000 + Math.random() * 8000000,
    type: 'B2C',
    vertical: 'Retail',
    status: 'Active',
    litiumBaseUrl: null
  }))
};

export const MOCK_EFFICIENCY: RevenueEfficiencyResponse = {
  globalAverageOrderValue: 850,
  medianOrderVolume: 12000,
  medianPortfolioShare: 0.05,
  tenants: Array.from({ length: 45 }).map((_, i) => ({
    tenantId: `t-${i}`,
    tenantName: `Mock Store ${i + 1}`,
    averageOrderValue: 200 + Math.random() * 1600,
    orderVolume: 5000 + Math.random() * 20000,
    portfolioShare: 0.01 + Math.random() * 0.15,
    portfolioSharePercentage: 1 + Math.random() * 15,
    growthVelocity: -5 + Math.random() * 25,
    currentRevenue: 1100000 + Math.random() * 9000000,
    transactionVolume: 5000 + Math.random() * 20000,
    type: 'B2C',
    vertical: 'Retail',
    status: 'Active',
    litiumBaseUrl: null
  }))
};

export const MOCK_ANOMALIES: VolumeAnomalyResponseDto[] = Array.from({ length: 40 }).map((_, i) => ({
  tenantId: `t-${i}`,
  tenantName: `Mock Store ${i + 1}`,
  currentVolume: 1000 + Math.floor(Math.random() * 5000),
  baselineVolume: 1200 + Math.floor(Math.random() * 4000),
  volumeDeviationPercentage: -15 + Math.random() * 30,
  type: 'B2C',
  vertical: 'Retail',
  status: 'Active'
}));

export const MOCK_TRANSACTION_DENSITY: TransactionDensityPointResponseDto[] = Array.from({ length: 7 * 24 }).map((_, i) => {
  const dayOfWeek = Math.floor(i / 24) + 1;
  const hour = i % 24;
  const timeFactor = Math.sin((hour - 6) / 24 * 2 * Math.PI) + 1.2;
  const dayFactor = dayOfWeek >= 5 ? 1.3 : 0.9;
  const count = Math.floor((10 + Math.random() * 50) * timeFactor * dayFactor);
  const totalRevenue = count * (500 + Math.random() * 400);
  return {
    dayOfWeek,
    hour,
    count,
    totalRevenue,
  };
});

export const MOCK_TRANSACTION_DENSITY_RESPONSE: TransactionDensityResponseDto = {
  points: MOCK_TRANSACTION_DENSITY,
  totalCount: MOCK_TRANSACTION_DENSITY.reduce((sum, point) => sum + point.count, 0),
  minCount: Math.min(...MOCK_TRANSACTION_DENSITY.map(point => point.count)),
  maxCount: Math.max(...MOCK_TRANSACTION_DENSITY.map(point => point.count)),
  averageCountPerBucket: MOCK_TRANSACTION_DENSITY.reduce((sum, point) => sum + point.count, 0) / (7 * 24),
  sampleQuality: 'Stable',
  requestedPeriod: 'Auto',
  effectivePeriod: 'T30',
  timeZoneId: 'Europe/Stockholm',
  periodStart: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  periodEnd: new Date().toISOString(),
};
