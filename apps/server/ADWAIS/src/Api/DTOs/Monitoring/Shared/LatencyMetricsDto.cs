// Part of the ADWAIS project, under the Business Source License 1.1.
// See /LICENSE for license information.
// SPDX-License-Identifier: BUSL-1.1

namespace Adwais.Api.DTOs.Monitoring;

public record LatencyMetricsDto(
    DateTimeOffset Date, 
    double? Average, 
    double? Lowest, 
    double? Highest);

