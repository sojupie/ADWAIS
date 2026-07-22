using Adwais.Domain.Enums;

namespace Adwais.Application.DTOs.Financial;

public record PortfolioImpactTenantDto(
    Guid TenantId,
    string TenantName,
    TenantType Type,
    decimal BaselineRevenue,
    decimal GrowthPercentage,
    decimal CurrentRevenue,
    decimal OrderVolume,
    decimal VolumeGrowthPercentage,
    decimal PortfolioSharePercentage,
    string? LitiumBaseUrl);

public record PortfolioImpactDto(
    decimal MedianBaselineRevenue,
    decimal GlobalGrowthPercentage,
    decimal MedianPortfolioShare,
    IReadOnlyList<PortfolioImpactTenantDto> Tenants);
