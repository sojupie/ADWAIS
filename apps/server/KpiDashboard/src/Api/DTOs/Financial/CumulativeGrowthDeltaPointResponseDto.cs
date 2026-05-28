namespace Api.DTOs.Financial;

public record CumulativeGrowthDeltaPointResponseDto(
    string Label,
    DateTimeOffset Timestamp,
    decimal CurrentCumulative,
    decimal PreviousCumulative,
    decimal CumulativeGrowthDelta);
