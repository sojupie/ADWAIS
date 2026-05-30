namespace Adwais.Api.DTOs.Financial;

public record VelocityPointResponseDto(
    string Label,
    DateTimeOffset Timestamp,
    decimal CurrentRevenue,
    decimal PreviousRevenue,
    decimal AbsoluteVariance);


