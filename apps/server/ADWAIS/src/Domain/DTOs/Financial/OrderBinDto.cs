namespace Adwais.Domain.DTOs.Financial;

public record OrderBinDto(
    string BinLabel,
    decimal MinValue,
    decimal MaxValue,
    int OrderCount,
    decimal CumulativePercentage,
    decimal KdeDensity);


