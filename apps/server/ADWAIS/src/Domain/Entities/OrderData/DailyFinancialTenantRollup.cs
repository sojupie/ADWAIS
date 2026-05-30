namespace Adwais.Domain.Entities.OrderData;

public class DailyFinancialTenantRollup
{
    public DateTimeOffset CreatedDate { get; set; }
    public TenantId TenantId { get; set; }
    public decimal Volume { get; set; }
    public decimal Revenue { get; set; }
}

