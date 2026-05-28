using Domain.Enums;

namespace Api.DTOs.Financial;

public record MomentumTenantResponseDto(
    Guid TenantId,
    string TenantName,
    TenantType Type,
    decimal BaselineRevenue,
    decimal GrowthPercentage,
    decimal CurrentRevenue);

public record MomentumResponseDto(
    decimal MedianBaselineRevenue,
    decimal GlobalGrowthPercentage,
    IReadOnlyList<MomentumTenantResponseDto> Tenants);
