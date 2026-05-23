namespace Api.DTOs.Financial;

public record MomentumTenantResponseDto(
    Guid TenantId,
    string TenantName,
    decimal BaselineRevenue,
    decimal GrowthPercentage,
    decimal CurrentRevenue);

public record MomentumResponseDto(
    decimal MedianBaselineRevenue,
    IReadOnlyList<MomentumTenantResponseDto> Tenants);
