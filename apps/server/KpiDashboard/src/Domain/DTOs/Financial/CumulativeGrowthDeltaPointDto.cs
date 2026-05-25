namespace Domain.DTOs.Financial;

public record CumulativeGrowthDeltaPointDto(
    string Label,
    DateTimeOffset Timestamp,
    decimal CumulativeGrowthDelta);
