namespace Api.Models;

public class LitiumOrderDto
{
    public string Id { get; set; } = string.Empty;
    public string OrderNumber { get; set; } = string.Empty;
    public DateTimeOffset CreatedDate { get; set; }
    public string OrderStatus { get; set; } = string.Empty;
    public decimal TotalValueIncludingVat { get; set; }
    public decimal TotalValueExcludingVat { get; set; }
    public string Currency { get; set; } = string.Empty;
    public Guid ChannelId { get; set; }
    public string ChannelName { get; set; } = string.Empty;
}