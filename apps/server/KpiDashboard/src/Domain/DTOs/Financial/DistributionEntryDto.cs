namespace Domain.DTOs.Financial;

public record DistributionEntryDto(
    Guid? TenantId,
    string TenantName,
    decimal AbsoluteRevenue,
    decimal CumulativePortfolioShare);
