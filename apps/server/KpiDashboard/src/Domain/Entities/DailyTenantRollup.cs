using System;

namespace Domain.Entities;

public class DailyTenantRollup
{
    public DateTime CreatedDate { get; set; }
    public Guid TenantId { get; set; }
    public long Volume { get; set; }
    public long Revenue { get; set; }
}