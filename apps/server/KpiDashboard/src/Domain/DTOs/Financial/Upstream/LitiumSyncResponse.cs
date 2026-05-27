namespace Domain.DTOs.Financial.Upstream;

public class LitiumSyncResponse
{
    public int? TotalOrders { get; set; }
    public List<LitiumOrderDto?>? Orders { get; set; } = new();
}