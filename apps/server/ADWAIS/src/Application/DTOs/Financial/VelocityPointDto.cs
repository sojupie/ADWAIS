namespace Adwais.Application.DTOs.Financial;

public record VelocityPointDto(
    DateTimeOffset Timestamp,
    decimal CurrentRevenue,
    decimal PreviousRevenue,
    decimal AbsoluteVariance);


