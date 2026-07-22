namespace Adwais.Api.DTOs.Financial;

public record AccumulatedRevenuePointResponseDto(
    DateTimeOffset Timestamp,
    decimal CurrentRevenue,
    decimal CurrentRevenueB2C,
    decimal CurrentRevenueB2B,
    decimal CurrentRevenueMixed,
    decimal PreviousRevenue,
    decimal CurrentAccumulated,
    decimal PreviousAccumulated);


