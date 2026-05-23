namespace Api.DTOs.Financial;

public record TransactionDensityPointResponseDto(
    int DayOfWeek,
    int Hour,
    int Count,
    decimal TotalRevenue);
