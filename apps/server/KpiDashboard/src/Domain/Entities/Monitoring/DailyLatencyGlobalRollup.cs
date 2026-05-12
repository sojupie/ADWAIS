using System;

namespace Domain.Entities.Monitoring;

public class DailyLatencyGlobalRollup
{
    public required DateTimeOffset Date { get; set; }
    public double? Average { get; set; }
    public double? Lowest { get; set; }
    public double? Highest { get; set; }
}
