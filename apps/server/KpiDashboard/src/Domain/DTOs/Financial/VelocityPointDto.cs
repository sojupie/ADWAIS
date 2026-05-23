namespace Domain.DTOs.Financial;

public record VelocityPointDto(
    string PeriodLabel,
    decimal CurrentRevenue,
    decimal PreviousRevenue,
    decimal AbsoluteVariance);
