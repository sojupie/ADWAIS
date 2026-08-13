// Part of the ADWAIS project, under the Business Source License 1.1.
// See /LICENSE for license information.
// SPDX-License-Identifier: BUSL-1.1

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
