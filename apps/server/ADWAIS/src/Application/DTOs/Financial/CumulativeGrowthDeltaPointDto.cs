namespace Adwais.Application.DTOs.Financial;

public record CumulativeGrowthDeltaPointDto(
    DateTimeOffset Timestamp,
    decimal CurrentCumulative,
    decimal PreviousCumulative,
    decimal CumulativeGrowthDelta);


