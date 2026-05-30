using Adwais.Domain.Entities.Monitoring;

namespace Adwais.Domain.DTOs.Monitoring;

public record MonitorAnalyticsDto(
    double? GlobalAverageLatency,
    IReadOnlyList<LatencyPointDto> LatencyPoints,
    IEnumerable<UptimeMonitor> Monitors);


