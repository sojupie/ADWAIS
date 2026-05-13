namespace Domain.Entities.OrderData;

public class DailyFinancialGlobalRollup
{
    public DateTime CreatedDate { get; set; }
    public decimal GlobalVolume { get; set; }
    public decimal GlobalRevenue { get; set; }
}