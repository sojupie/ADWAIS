using Domain.Enums;

namespace Domain.DTOs.Financial;

public record MomentumTenantDto(
    Guid TenantId,
    string TenantName,
    TenantType Type,
    decimal BaselineRevenue,
    decimal GrowthPercentage,
    decimal CurrentRevenue);

public record MomentumDto(
    decimal MedianBaselineRevenue,
    decimal GlobalGrowthPercentage,
    IReadOnlyList<MomentumTenantDto> Tenants);
