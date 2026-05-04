namespace Domain.Entities.OrderData;

public class DailyFinancialGlobalRollup
{
    public DateTime CreatedDate { get; set; }
    public long GlobalVolume { get; set; }
    public long GlobalRevenue { get; set; }
}