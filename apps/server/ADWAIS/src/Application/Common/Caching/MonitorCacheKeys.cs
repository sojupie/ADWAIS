namespace Adwais.Application.Common.Caching;

public static class GlobalCacheKeys
{
    public static string MonitorState(int monitorId) => $"monitor_state_{monitorId}";
    public const string UptimeRobotRateLimit = "UptimeRobotRateLimitEpoch";
}

public record LiveMonitorState(string StatusStr, double? CurrentLatency);
