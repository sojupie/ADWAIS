namespace Adwais.Api.DTOs.Financial;

public record TransactionDensityResponseDto(
    int TotalCount,
    int MinCount,
    int MaxCount,
    IReadOnlyList<TransactionDensityPointResponseDto> Points);
