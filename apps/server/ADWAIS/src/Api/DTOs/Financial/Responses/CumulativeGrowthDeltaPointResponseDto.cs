namespace Adwais.Api.DTOs.Financial;

public record CumulativeGrowthDeltaPointResponseDto(
    DateTimeOffset Timestamp,
    decimal CurrentCumulative,
    decimal PreviousCumulative,
    decimal CumulativeGrowthDelta);


