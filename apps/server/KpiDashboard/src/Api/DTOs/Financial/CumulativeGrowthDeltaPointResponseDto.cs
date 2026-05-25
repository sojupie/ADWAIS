namespace Api.DTOs.Financial;

public record CumulativeGrowthDeltaPointResponseDto(
    string Label,
    DateTimeOffset Timestamp,
    decimal CumulativeGrowthDelta);
