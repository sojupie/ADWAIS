// Part of the ADWAIS project, under the Business Source License 1.1.
// See /LICENSE for license information.
// SPDX-License-Identifier: BUSL-1.1

using System;

namespace Adwais.Application.DTOs.Monitoring;

public record LatencyPointDto(
    DateTimeOffset Timestamp,
    double? Average,
    double? PreviousAverage,
    double? Lowest,
    double? Highest,
    LatencySampleState CurrentState,
    LatencySampleState PreviousState);


