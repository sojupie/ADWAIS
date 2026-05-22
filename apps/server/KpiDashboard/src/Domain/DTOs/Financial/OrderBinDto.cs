namespace Domain.DTOs.Financial;

public record OrderBinDto(
    string BinLabel,
    decimal BinMin,
    decimal BinMax,
    int OrderCount);
