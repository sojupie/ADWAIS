namespace Domain.Entities.OrderData;

public class Order
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public string? OrderState { get; set; } = string.Empty;
    public string? OrderType { get; set; } = string.Empty;
    public string LitiumOrderId { get; set; } = string.Empty;
    public DateTimeOffset CreatedDate { get; set; }
    public DateTimeOffset? LastUpdate { get; set; }
    public int TotalValueIncVat { get; set; }
    public int TotalValueExcVat { get; set; }
    public string Currency { get; set; } = string.Empty;


    public Tenant Tenant { get; set; } = null!;
}