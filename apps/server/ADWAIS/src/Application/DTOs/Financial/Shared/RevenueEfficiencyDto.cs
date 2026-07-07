using Adwais.Domain.Enums;

namespace Adwais.Application.DTOs.Financial;

public record RevenueEfficiencyTenantDto(
    Guid TenantId,
    string TenantName,
    TenantType Type,
    decimal AverageOrderValue,
    decimal PortfolioSharePercentage,
    decimal GrowthVelocity,
    string? LitiumBaseUrl
);

public record RevenueEfficiencyDto(
    decimal GlobalAverageOrderValue,
    decimal MedianPortfolioShare,
    IReadOnlyList<RevenueEfficiencyTenantDto> Tenants
);


