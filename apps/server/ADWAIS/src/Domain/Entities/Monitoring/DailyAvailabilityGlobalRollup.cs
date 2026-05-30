using System;

namespace Adwais.Domain.Entities.Monitoring;

public class DailyAvailabilityGlobalRollup
{
    public required DateTimeOffset Date { get; set; }
    public double? UptimePercentage { get; set; }
}


