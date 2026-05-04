namespace Domain.Entities.OrderData;

public class DailyFinancialTenantRollup
{
    public DateTime CreatedDate { get; set; }
    public Guid TenantId { get; set; }
    public long Volume { get; set; }
    public long Revenue { get; set; }
}