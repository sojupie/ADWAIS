namespace Domain.DTOs.Financial;

public record AccumulatedRevenuePointDto(
    string Label,
    DateTimeOffset Timestamp,
    decimal CurrentRevenue,
    decimal PreviousRevenue,g
    decimal PreviousAccumulated);
