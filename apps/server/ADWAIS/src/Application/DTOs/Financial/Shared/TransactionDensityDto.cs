namespace Adwais.Application.DTOs.Financial;

public record TransactionDensityDto(
    int TotalCount,
    int MinCount,
    int MaxCount,
    DateTimeOffset PeriodStart,
    DateTimeOffset PeriodEnd,
    IReadOnlyList<TransactionDensityPointDto> Points);
