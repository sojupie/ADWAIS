namespace Adwais.Api.DTOs.Financial;

public record AccumulatedRevenuePointResponseDto(
    DateTimeOffset Timestamp,
    decimal CurrentRevenue,
    decimal PreviousRevenue,
    decimal CurrentAccumulated,
    decimal PreviousAccumulated);


