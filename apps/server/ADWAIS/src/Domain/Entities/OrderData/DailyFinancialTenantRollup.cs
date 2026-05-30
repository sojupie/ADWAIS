namespace Adwais.Domain.Entities.OrderData;

public class DailyFinancialTenantRollup
{
    public DateTimeOffset CreatedDate { get; set; }
    public Guid TenantId { get; set; }
    public decimal Volume { get; set; }
    public decimal Revenue { get; set; }
}

