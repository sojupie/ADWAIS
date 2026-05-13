namespace Domain.Entities.OrderData;

public class Order
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public required string OrderState { get; set; }
    public required string LitiumOrderId { get; set; }
    public DateTimeOffset CreatedDate { get; set; }
    public int TotalValueIncVat { get; set; }
    public int TotalValueExcVat { get; set; }
    public required string Currency { get; set; }

    public Tenant? Tenant { get; set; }
}
