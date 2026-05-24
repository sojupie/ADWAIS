using System;

namespace Api.DTOs.Monitoring;

public record LatencyPointResponseDto(
    string Label,
    DateTimeOffset Timestamp,
    double Average,
    double PreviousAverage,
    double Lowest,
    double Highest);
