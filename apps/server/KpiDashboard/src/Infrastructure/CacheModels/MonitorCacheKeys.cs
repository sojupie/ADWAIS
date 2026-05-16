namespace Infrastructure.CacheModels;

public class MonitorCacheKeys
{
    public static string MonitorState(int monitorId) => $"monitor_state_{monitorId}";
}

public record LiveMonitorState(string StatusStr, int? Latency);