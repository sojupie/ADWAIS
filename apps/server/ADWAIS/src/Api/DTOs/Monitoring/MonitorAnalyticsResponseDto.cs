namespace Adwais.Api.DTOs.Monitoring;

public record MonitorAnalyticsResponseDto(
    double? GlobalAverageLatency,
    IReadOnlyList<LatencyPointResponseDto> LatencyPoints,
    IReadOnlyList<UptimeMonitorDto> Monitors);


