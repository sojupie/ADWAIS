namespace Adwais.Domain.DTOs.Financial;

public record CumulativeGrowthDeltaPointDto(
    string Label,
    DateTimeOffset Timestamp,
    decimal CurrentCumulative,
    decimal PreviousCumulative,
    decimal CumulativeGrowthDelta);


