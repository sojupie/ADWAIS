using Domain.Enums;

namespace Api.DTOs.Financial;

public record RevenueEfficiencyTenantResponseDto(
    Guid TenantId,
    string TenantName,
    TenantType Type,
    decimal AverageOrderValue,
    decimal PortfolioSharePercentage,
    decimal GrowthVelocity
);

public record RevenueEfficiencyResponseDto(
    decimal GlobalAverageOrderValue,
    decimal MedianPortfolioShare,
    IReadOnlyList<RevenueEfficiencyTenantResponseDto> Tenants
);
