using System;

namespace Adwais.Domain.DTOs.Monitoring;

public record LatencyPointDto(
    string Label,
    DateTimeOffset Timestamp,
    double Average,
    double PreviousAverage,
    double Lowest,
    double Highest);


