using System;

namespace Domain.Entities.Monitoring;

public class DailyLatencyTenantRollup
{
    public Guid TenantId { get; set; }
    public DateTimeOffset Date { get; set; }
    public double? Average { get; set; }
    public double? Lowest { get; set; }
    public double? Highest { get; set; }

    public Tenant Tenant { get; set; } = null!;
}
