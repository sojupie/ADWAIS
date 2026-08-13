// Part of the ADWAIS project, under the Business Source License 1.1.
// See /LICENSE for license information.
// SPDX-License-Identifier: BUSL-1.1

export const UPTIME_MONITOR_TYPES = [
  'HTTP',
  'KEYWORD',
  'PING',
  'PORT',
  'HEARTBEAT',
  'DNS',
] as const;

export const DEFAULT_UPTIME_MONITOR_TYPE = 'HTTP';

export function getMonitorType(type?: string | null): string {
  return type?.trim().toUpperCase() || DEFAULT_UPTIME_MONITOR_TYPE;
}
