namespace Adwais.Domain.DTOs.Financial;

public record GrowthExtremeDto(
    Guid TenantId,
    string TenantName,
    decimal CurrentRevenue,
    decimal PreviousRevenue,
    decimal GrowthPercentage,
    decimal AbsoluteVariance);


