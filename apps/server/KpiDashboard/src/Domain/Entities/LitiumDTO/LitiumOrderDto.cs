namespace Domain.Entities.LitiumDTO;

public class LitiumOrderDto
{
    public required Guid Id { get; set; }
    public required string OrderNumber { get; set; }
    public required DateTimeOffset CreatedDate { get; set; }
    public string? OrderStatus { get; set; }
    public decimal? TotalValueIncludingVat { get; set; }
    public decimal? TotalValueExcludingVat { get; set; }
    public string? Currency { get; set; } = string.Empty;
}