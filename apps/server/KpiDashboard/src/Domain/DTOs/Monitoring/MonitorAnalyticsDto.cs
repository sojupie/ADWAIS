using Domain.Entities.Monitoring;

namespace Domain.DTOs.Monitoring;

public record MonitorAnalyticsDto(
    IReadOnlyList<LatencyPointDto> LatencyPoints,
    IEnumerable<UptimeMonitor> Monitors);
