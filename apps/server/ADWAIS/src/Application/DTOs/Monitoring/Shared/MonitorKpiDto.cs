// Part of the ADWAIS project, under the Business Source License 1.1.
// See /LICENSE for license information.
// SPDX-License-Identifier: BUSL-1.1

namespace Adwais.Application.DTOs.Monitoring;

public record MonitorKpiDto(
    double? AverageUptime,
    double? PreviousAverageUptime,
    double? UptimeGrowthPercentage,
    double? AverageLatency,
    double? PreviousAverageLatency,
    double? LatencyGrowthPercentage,
    double? HighestLatency,
    double? PreviousHighestLatency,
    double? HighestLatencyGrowthPercentage,
    double? LowestLatency,
    double? PreviousLowestLatency,
    double? LowestLatencyGrowthPercentage);
