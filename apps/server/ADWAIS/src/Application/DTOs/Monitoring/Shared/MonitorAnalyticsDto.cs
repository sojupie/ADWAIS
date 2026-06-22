using Adwais.Domain.Entities.Monitoring;

namespace Adwais.Application.DTOs.Monitoring;

public record MonitorAnalyticsDto(
    double? GlobalAverageLatency,
    IReadOnlyList<LatencyPointDto> LatencyPoints,
    IEnumerable<UptimeMonitor> Monitors,
    MonitorKpiDto Kpis);


