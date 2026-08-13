// Part of the ADWAIS project, under the Business Source License 1.1.
// See /LICENSE for license information.
// SPDX-License-Identifier: BUSL-1.1

namespace Adwais.Application.DTOs.GlobalConfig;

public record FetchIntervalsDto
{
    public int LatencyFetchIntervalMinutes { get; init; }
    public int UptimeFetchIntervalMinutes { get; init; }
    public int StatusFetchIntervalMinutes { get; init; }
    public int OrderFetchIntervalMinutes { get; init; }
    public int UserStatsFetchIntervalMinutes { get; init; }
    public int FeedFetchIntervalHours { get; init; }
}
