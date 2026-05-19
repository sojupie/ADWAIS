namespace Infrastructure.CacheModels;

public static class GlobalCacheKeys
{
    public static string MonitorState(int monitorId) => $"monitor_state_{monitorId}";
    public const string UptimeRobotRateLimit = "UptimeRobotRateLimitEpoch";
}

public record LiveMonitorState(string StatusStr);