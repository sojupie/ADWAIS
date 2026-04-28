namespace Api.Models;

public class LitiumSyncResponse
{
    public int TotalOrders { get; set; }
    public List<LitiumOrderDto> Orders { get; set; } = new();
}