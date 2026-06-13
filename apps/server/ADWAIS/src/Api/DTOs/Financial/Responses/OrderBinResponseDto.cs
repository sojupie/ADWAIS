namespace Adwais.Api.DTOs.Financial;

public record OrderBinResponseDto(
    string BinLabel,
    decimal MinValue,
    decimal MaxValue,
    int OrderCount,
    decimal CumulativePercentage,
    decimal KdeDensity);


