namespace Adwais.Domain.DTOs.Financial;

public record TransactionDensityPointDto(
    int DayOfWeek, // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    int Hour,      // 0-23
    int Count,
    decimal TotalRevenue);


