using Adwais.Domain.Enums;

namespace Adwais.Api.DTOs.Financial;

public record PortfolioImpactTenantResponseDto(
    Guid TenantId,
    string TenantName,
    TenantType Type,
    decimal BaselineRevenue,
    decimal GrowthPercentage,
    decimal CurrentRevenue,
    decimal OrderVolume,
    decimal VolumeGrowthPercentage,
    decimal PortfolioSharePercentage,
    string? OrderProviderEndpoint);

public record PortfolioImpactResponseDto(
    decimal MedianBaselineRevenue,
    decimal GlobalGrowthPercentage,
    decimal MedianPortfolioShare,
    IReadOnlyList<PortfolioImpactTenantResponseDto> Tenants);
