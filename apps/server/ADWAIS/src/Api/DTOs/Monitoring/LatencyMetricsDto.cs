namespace Adwais.Api.DTOs.Monitoring;

public record LatencyMetricsDto(
    DateTimeOffset Date, 
    double? Average, 
    double? Lowest, 
    double? Highest);

