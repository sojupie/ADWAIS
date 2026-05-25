namespace Domain.Entities.Monitoring;

public class UptimeMonitor
{
    public int Id { get; set; } // External ID from UptimeRobot
    public Guid TenantId { get; set; }
    public required string Name { get; set; }
    public required string Url { get; set; }
    public double? UptimeSla { get; set; }
    public bool UptimeMonitorEnabled { get; set; }
    public DateTimeOffset? LastUpdate { get; set; }
    public DateTimeOffset? LastUptimeUpdate { get; set; }
    public DateTimeOffset? LastLatencyUpdate { get; set; }
    public DateTimeOffset CreatedDate { get; set; }
    public int UpdateInterval { get; set; }
    public double CurrentUptimePercentage { get; set; }
    public string? LastSyncError { get; set; }
    public Tenant? Tenant { get; set; }
    public ICollection<ResponseTime> ResponseTimes { get; set; } = new List<ResponseTime>();
    
    // Telemetry and live statuses; do not persist.
    public string StatusStr { get; set; } = "Unknown";
}
