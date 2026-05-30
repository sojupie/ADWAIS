using Adwais.Domain.Enums;

namespace Adwais.Domain.Entities.OrderData;

public class Order
{
    public Guid Id { get; set; }
    public TenantId TenantId { get; set; }
    public Guid? OrganizationSystemId { get; set; }
    public OrderState OrderState { get; set; }
    public required string LitiumOrderId { get; set; }
    public DateTimeOffset CreatedDate { get; set; }
    public decimal TotalValueIncVat { get; set; }
    public decimal TotalValueExcVat { get; set; }
    public required string Currency { get; set; }

    public Tenant? Tenant { get; set; }
}

