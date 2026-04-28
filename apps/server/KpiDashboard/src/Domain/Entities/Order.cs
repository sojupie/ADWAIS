using System;

namespace Domain.Entities;

public class Order
{
    public long Id { get; set; }
    public Guid TenantId { get; set; }
    public string LitiumOrderId { get; set; } = string.Empty;
    public DateTimeOffset CreatedDate { get; set; }
    public int TotalValueIncVat { get; set; }
    public int TotalValueExcVat { get; set; }
    public string Currency { get; set; } = string.Empty;
    public Guid ChannelId { get; set; }
    public string ChannelName { get; set; } = string.Empty;

    public Tenant Tenant { get; set; } = null!;
}