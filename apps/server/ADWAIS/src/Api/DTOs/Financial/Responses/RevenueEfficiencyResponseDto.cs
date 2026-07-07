using Adwais.Domain.Enums;

namespace Adwais.Api.DTOs.Financial;

public record RevenueEfficiencyTenantResponseDto(
    Guid TenantId,
    string TenantName,
    TenantType Type,
    decimal AverageOrderValue,
    decimal PortfolioSharePercentage,
    decimal GrowthVelocity,
    string? LitiumBaseUrl
);

public record RevenueEfficiencyResponseDto(
    decimal GlobalAverageOrderValue,
    decimal MedianPortfolioShare,
    IReadOnlyList<RevenueEfficiencyTenantResponseDto> Tenants
);


