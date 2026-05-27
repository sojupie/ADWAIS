using Domain.Entities.Monitoring;

namespace Domain.DTOs.Monitoring;

public record MonitorAnalyticsDto(
    double? GlobalAverageLatency,
    IReadOnlyList<LatencyPointDto> LatencyPoints,
    IEnumerable<UptimeMonitor> Monitors);
