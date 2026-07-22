namespace Adwais.Application.DTOs.Financial;

public record AccumulatedRevenuePointDto(
    DateTimeOffset Timestamp,
    decimal CurrentRevenue,
    decimal CurrentRevenueB2C,
    decimal CurrentRevenueB2B,
    decimal CurrentRevenueMixed,
    decimal PreviousRevenue,
    decimal CurrentAccumulated,
    decimal PreviousAccumulated);


