// Part of the ADWAIS project, under the Business Source License 1.1.
// See /LICENSE for license information.
// SPDX-License-Identifier: BUSL-1.1

namespace Adwais.Application.Common.Caching;

public static class GlobalCacheKeys
{
    public static string MonitorState(int monitorId) => $"monitor_state_{monitorId}";
    public const string UptimeRobotRateLimit = "UptimeRobotRateLimitEpoch";
}

public record LiveMonitorState(string StatusStr, double? CurrentLatency);
