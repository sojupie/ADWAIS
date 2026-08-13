// Part of the ADWAIS project, under the Business Source License 1.1.
// See /LICENSE for license information.
// SPDX-License-Identifier: BUSL-1.1

using System;
using Adwais.Application.DTOs.Monitoring;

using System;

namespace Adwais.Api.DTOs.Monitoring;

public sealed record LatencyPointResponseDto
{
    public required DateTimeOffset Timestamp { get; init; }
    public required double? Average { get; init; }
    public required double? PreviousAverage { get; init; }
    public required double? P10 { get; init; }
    public required double? P90 { get; init; }
    public required LatencySampleState CurrentState { get; init; }
    public required LatencySampleState PreviousState { get; init; }
}


