namespace Adwais.Api.DTOs.Financial;

public record VelocityPointResponseDto(
    DateTimeOffset Timestamp,
    decimal CurrentRevenue,
    decimal PreviousRevenue,
    decimal AbsoluteVariance);


