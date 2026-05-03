namespace Domain.Entities.OrderData;

public class DailyGlobalRollup
{
    public DateTime CreatedDate { get; set; }
    public long GlobalVolume { get; set; }
    public long GlobalRevenue { get; set; }
}