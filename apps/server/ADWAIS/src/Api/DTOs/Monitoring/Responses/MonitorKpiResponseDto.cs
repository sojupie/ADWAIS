namespace Adwais.Api.DTOs.Monitoring;

public record MonitorKpiResponseDto(
    double? AverageUptime,
    double? PreviousAverageUptime,
    double? UptimeGrowthPercentage,
    double? AverageLatency,
    double? PreviousAverageLatency,
    double? LatencyGrowthPercentage,
    double? HighestLatency,
    double? PreviousHighestLatency,
    double? HighestLatencyGrowthPercentage,
    double? LowestLatency,
    double? PreviousLowestLatency,
    double? LowestLatencyGrowthPercentage);
