namespace Adwais.Api.DTOs.Monitoring;

public sealed record MonitorAnalyticsResponseDto
{
    public required double? GlobalAverageLatency { get; init; }

    public required IReadOnlyList<LatencyPointResponseDto> LatencyPoints { get; init; }

    public required MonitorKpiResponseDto Kpis { get; init; }
}


