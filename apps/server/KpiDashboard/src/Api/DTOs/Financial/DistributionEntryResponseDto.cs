namespace Api.DTOs.Financial;

public record DistributionEntryResponseDto(
    Guid? TenantId,
    string TenantName,
    decimal AbsoluteRevenue,
    decimal CumulativePortfolioShare);
