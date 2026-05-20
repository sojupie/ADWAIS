namespace Api.DTOs.BackgroundJob;

public class RateLimits
{
    public int LatencyRateLimit { get; set; }
    public int UptimeRateLimit { get; set; }
    public int StatusRateLimit { get; set; }
    public int LitiumRateLimit { get; set; }
}