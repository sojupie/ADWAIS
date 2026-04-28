using System;

namespace Domain.Entities;

public class DailyGlobalRollup
{
    public DateTime CreatedDate { get; set; }
    public long GlobalVolume { get; set; }
    public long GlobalRevenue { get; set; }
}