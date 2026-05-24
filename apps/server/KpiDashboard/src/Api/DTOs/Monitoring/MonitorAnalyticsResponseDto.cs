namespace Api.DTOs.Monitoring;

public record MonitorAnalyticsResponseDto(
    IReadOnlyList<LatencyPointResponseDto> LatencyPoints,
    IReadOnlyList<UptimeMonitorDto> Monitors);
