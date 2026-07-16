namespace Adwais.Application.DTOs.Financial;

public record TransactionDensityDto(
    int TotalCount,
    int MinCount,
    int MaxCount,
    IReadOnlyList<TransactionDensityPointDto> Points);
