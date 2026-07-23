namespace Adwais.Application.DTOs.Monitoring;

public record MonitorAnalyticsDto(
    double? GlobalAverageLatency,
    IReadOnlyList<LatencyPointDto> LatencyPoints,
    MonitorKpiDto Kpis);


