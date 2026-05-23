namespace Domain.DTOs.Financial;

public record MomentumTenantDto(
    Guid TenantId,
    string TenantName,
    decimal BaselineRevenue,
    decimal GrowthPercentage,
    decimal CurrentRevenue);

public record MomentumDto(
    decimal MedianBaselineRevenue,
    IReadOnlyList<MomentumTenantDto> Tenants);
