namespace Api.DTOs.Financial;

public record OrderBinResponseDto(
    string BinLabel,
    decimal BinMin,
    decimal BinMax,
    int OrderCount);
