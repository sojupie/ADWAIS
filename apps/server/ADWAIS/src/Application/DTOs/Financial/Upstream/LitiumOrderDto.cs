namespace Adwais.Application.DTOs.Financial.Upstream;

public class LitiumOrderDto
{
    public required Guid Id { get; set; }
    public Guid? OrganizationSystemId { get; set; }
    public required string OrderNumber { get; set; }
    public required DateTimeOffset CreatedDate { get; set; }
    public required string OrderStatus { get; set; }
    public decimal? TotalValueIncludingVat { get; set; }
    public decimal? TotalValueExcludingVat { get; set; }
    public string? Currency { get; set; } = string.Empty;
}

