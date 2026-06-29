using System;

namespace Adwais.Application.DTOs.Monitoring;

public record LatencyPointDto(
    DateTimeOffset Timestamp,
    double? Average,
    double? PreviousAverage,
    double? Lowest,
    double? Highest);


