namespace Adwais.Domain.DTOs.Financial;

public record AccumulatedRevenuePointDto(
    string Label,
    DateTimeOffset Timestamp,
    decimal CurrentRevenue,
    decimal PreviousRevenue,
    decimal CurrentAccumulated,
    decimal PreviousAccumulated);


