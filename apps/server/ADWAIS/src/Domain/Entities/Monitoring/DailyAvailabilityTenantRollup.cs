using System;

namespace Adwais.Domain.Entities.Monitoring;

public class DailyAvailabilityTenantRollup
{
    public required Guid TenantId { get; set; }
    public required DateTimeOffset Date { get; set; }
    public double? UptimePercentage { get; set; }

    public Tenant Tenant { get; set; } = null!;
}


