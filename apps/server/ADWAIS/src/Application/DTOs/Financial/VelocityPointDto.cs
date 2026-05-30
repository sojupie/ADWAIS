namespace Adwais.Application.DTOs.Financial;

public record VelocityPointDto(
    string Label,
    DateTimeOffset Timestamp,
    decimal CurrentRevenue,
    decimal PreviousRevenue,
    decimal AbsoluteVariance);


