namespace Domain.Entities.LitiumDTO;

public class LitiumOrderDto
{
    public Guid Id { get; set; }
    public string OrderNumber { get; set; } = string.Empty;
    public DateTimeOffset CreatedDate { get; set; }
    public string OrderStatus { get; set; } = string.Empty;
    public decimal TotalValueIncludingVat { get; set; }
    public decimal TotalValueExcludingVat { get; set; }
    public string Currency { get; set; } = string.Empty;
}