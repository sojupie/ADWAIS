namespace Adwais.Application.DTOs.Financial;

public record AccumulatedRevenuePointDto(
    DateTimeOffset Timestamp,
    decimal CurrentRevenue,
    decimal PreviousRevenue,
    decimal CurrentAccumulated,
    decimal PreviousAccumulated);


