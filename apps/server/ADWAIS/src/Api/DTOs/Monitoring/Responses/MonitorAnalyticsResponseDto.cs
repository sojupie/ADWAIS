// Part of the ADWAIS project, under the Business Source License 1.1.
// See /LICENSE for license information.
// SPDX-License-Identifier: BUSL-1.1

namespace Adwais.Api.DTOs.Monitoring;

public sealed record MonitorAnalyticsResponseDto
{
    public required double? GlobalAverageLatency { get; init; }

    public required IReadOnlyList<LatencyPointResponseDto> LatencyPoints { get; init; }

    public required MonitorKpiResponseDto Kpis { get; init; }
}


