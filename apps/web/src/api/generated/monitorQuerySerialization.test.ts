import { describe, expect, it } from 'vitest';
import {
  getGetApiMonitorsAnalyticsUrl,
  getGetApiMonitorsUrl,
} from './endpoints';

describe('monitor query serialization', () => {
  it.each([
    getGetApiMonitorsUrl,
    getGetApiMonitorsAnalyticsUrl,
  ])('serializes array filters as repeated query keys', getUrl => {
    const url = new URL(getUrl({
      tags: ['prod', 'dev'],
      statuses: ['UP', 'DOWN'],
    }), 'https://example.test');

    expect(url.searchParams.getAll('tags')).toEqual(['prod', 'dev']);
    expect(url.searchParams.getAll('statuses')).toEqual(['UP', 'DOWN']);
  });
});
