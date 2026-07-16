namespace Adwais.Api.DTOs.Financial;

public record TransactionDensityResponseDto(
    int TotalCount,
    int MinCount,
    int MaxCount,
    DateTimeOffset PeriodStart,
    DateTimeOffset PeriodEnd,
    IReadOnlyList<TransactionDensityPointResponseDto> Points);
