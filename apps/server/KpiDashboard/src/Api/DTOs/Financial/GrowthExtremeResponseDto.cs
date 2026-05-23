namespace Api.DTOs.Financial;

public record GrowthExtremeResponseDto(
    Guid TenantId,
    string TenantName,
    decimal CurrentRevenue,
    decimal PreviousRevenue,
    decimal GrowthPercentage,
    decimal AbsoluteVariance);
