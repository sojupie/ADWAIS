using Domain.Enums;

namespace Domain.DTOs.Financial;

public record RevenueEfficiencyDto(
    Guid TenantId,
    string TenantName,
    TenantType Type,
    decimal AverageOrderValue,
    decimal PortfolioSharePercentage,
    decimal GrowthVelocity
);
