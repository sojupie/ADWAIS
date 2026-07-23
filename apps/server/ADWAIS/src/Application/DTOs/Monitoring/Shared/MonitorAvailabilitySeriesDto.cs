namespace Adwais.Application.DTOs.Monitoring;

public sealed record MonitorAvailabilitySeriesDto(
    DateTimeOffset PeriodStart,
    DateTimeOffset PeriodEnd,
    double? AverageUptimePercentage,
    double? LowestUptimePercentage,
    IReadOnlyList<MonitorAvailabilityPointDto> Points);

public sealed record MonitorAvailabilityPointDto(
    DateOnly Date,
    DateOnly EndDate,
    double? UptimePercentage,
    double? LowestMonitorUptimePercentage,
    int MonitorCount,
    bool IsPartial);
