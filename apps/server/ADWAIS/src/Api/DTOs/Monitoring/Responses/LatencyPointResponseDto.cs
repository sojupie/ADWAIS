using System;

using System;

namespace Adwais.Api.DTOs.Monitoring;

public record LatencyPointResponseDto(
    DateTimeOffset Timestamp,
    double? Average,
    double? PreviousAverage,
    double? Lowest,
    double? Highest);


