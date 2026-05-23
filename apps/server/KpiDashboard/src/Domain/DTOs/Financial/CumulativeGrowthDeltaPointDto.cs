namespace Domain.DTOs.Financial;

public record CumulativeGrowthDeltaPointDto(
    string PeriodLabel,
    decimal CumulativeGrowthDelta);
