using Adwais.Domain.Enums;

namespace Adwais.Application.DTOs.Financial;

public record MomentumTenantDto(
    Guid TenantId,
    string TenantName,
    TenantType Type,
    decimal BaselineRevenue,
    decimal GrowthPercentage,
    decimal CurrentRevenue,
    string? LitiumBaseUrl);

public record MomentumDto(
    decimal MedianBaselineRevenue,
    decimal GlobalGrowthPercentage,
    IReadOnlyList<MomentumTenantDto> Tenants);


