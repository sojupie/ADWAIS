using Adwais.Domain.Enums;

namespace Adwais.Domain.DTOs.Financial;

public record RevenueEfficiencyTenantDto(
    Guid TenantId,
    string TenantName,
    TenantType Type,
    decimal AverageOrderValue,
    decimal PortfolioSharePercentage,
    decimal GrowthVelocity
);

public record RevenueEfficiencyDto(
    decimal GlobalAverageOrderValue,
    decimal MedianPortfolioShare,
    IReadOnlyList<RevenueEfficiencyTenantDto> Tenants
);


