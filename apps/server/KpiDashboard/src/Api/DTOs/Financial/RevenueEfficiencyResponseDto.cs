using Domain.Enums;

namespace Api.DTOs.Financial;

public class RevenueEfficiencyResponseDto
{
    public Guid TenantId { get; set; }
    public string TenantName { get; set; } = string.Empty;
    public TenantType Type { get; set; }
    public decimal AverageOrderValue { get; set; }
    public decimal PortfolioSharePercentage { get; set; }
    public decimal GrowthVelocity { get; set; }
}
