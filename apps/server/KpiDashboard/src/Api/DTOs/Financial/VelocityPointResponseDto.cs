namespace Api.DTOs.Financial;

public record VelocityPointResponseDto(
    string PeriodLabel,
    decimal CurrentRevenue,
    decimal PreviousRevenue,
    decimal AbsoluteVariance);
