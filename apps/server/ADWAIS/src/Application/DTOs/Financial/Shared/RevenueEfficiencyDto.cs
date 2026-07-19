using Adwais.Domain.Enums;

namespace Adwais.Application.DTOs.Financial;

public record RevenueEfficiencyTenantDto(
    Guid TenantId,
    string TenantName,
    TenantType Type,
    decimal AverageOrderValue,
    decimal OrderVolume,
    decimal PortfolioSharePercentage,
    decimal GrowthVelocity,
    string? LitiumBaseUrl
);

public record RevenueEfficiencyDto(
    decimal GlobalAverageOrderValue,
    decimal MedianOrderVolume,
    decimal MedianPortfolioShare,
    IReadOnlyList<RevenueEfficiencyTenantDto> Tenants
);


