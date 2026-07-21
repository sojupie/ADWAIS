import { describe, expect, it } from 'vitest';
import {
  getGetApiFinancialKpisUrl,
  getGetApiFinancialTransactionDensityUrl,
} from './endpoints';

describe('generated Financial tenantTypes parameters', () => {
  it('serializes each selected business model as a repeated query key', () => {
    const kpiUrl = new URL(getGetApiFinancialKpisUrl({ tenantTypes: ['B2B', 'Mixed'] }), 'http://localhost');
    const densityUrl = new URL(
      getGetApiFinancialTransactionDensityUrl({ tenantTypes: ['B2C', 'Mixed'] }),
      'http://localhost',
    );

    expect(kpiUrl.searchParams.getAll('tenantTypes')).toEqual(['B2B', 'Mixed']);
    expect(densityUrl.searchParams.getAll('tenantTypes')).toEqual(['B2C', 'Mixed']);
  });
});
