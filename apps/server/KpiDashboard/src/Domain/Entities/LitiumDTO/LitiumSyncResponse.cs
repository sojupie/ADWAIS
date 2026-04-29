namespace Domain.Entities.LitiumDTO;

public class LitiumSyncResponse
{
    public int TotalOrders { get; set; }
    public List<LitiumOrderDto> Orders { get; set; } = new();
}