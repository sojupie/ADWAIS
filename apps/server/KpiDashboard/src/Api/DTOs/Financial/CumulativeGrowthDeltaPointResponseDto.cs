namespace Api.DTOs.Financial;

public record CumulativeGrowthDeltaPointResponseDto(
    string PeriodLabel,
    decimal CumulativeGrowthDelta);
