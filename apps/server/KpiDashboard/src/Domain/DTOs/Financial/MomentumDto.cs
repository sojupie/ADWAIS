namespace Domain.DTOs.Financial;

public record MomentumTenantDto(
    Guid TenantId,
    string TenantName,
    decimal BaselineRevenue,
    decimal GrowthPercentage,
    decimal CurrentVolume);

public record MomentumDto(
    decimal MedianBaselineRevenue,
    IReadOnlyList<MomentumTenantDto> Tenants);
