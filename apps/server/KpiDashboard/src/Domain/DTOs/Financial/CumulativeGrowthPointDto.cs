namespace Domain.DTOs.Financial;

public record CumulativeGrowthPointDto(
    string PeriodLabel,
    decimal CumulativeGrowth);
