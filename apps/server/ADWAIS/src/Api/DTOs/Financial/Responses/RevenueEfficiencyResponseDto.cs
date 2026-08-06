using Adwais.Domain.Enums;

namespace Adwais.Api.DTOs.Financial;

public record RevenueEfficiencyTenantResponseDto(
    Guid TenantId,
    string TenantName,
    TenantType Type,
    decimal AverageOrderValue,
    decimal OrderVolume,
    decimal PortfolioSharePercentage,
    decimal GrowthVelocity,
    string? OrderProviderEndpoint
);

public record RevenueEfficiencyResponseDto(
    decimal GlobalAverageOrderValue,
    decimal MedianOrderVolume,
    decimal MedianPortfolioShare,
    IReadOnlyList<RevenueEfficiencyTenantResponseDto> Tenants
);


