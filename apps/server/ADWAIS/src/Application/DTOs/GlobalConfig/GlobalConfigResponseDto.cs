// Part of the ADWAIS project, under the Business Source License 1.1.
// See /LICENSE for license information.
// SPDX-License-Identifier: BUSL-1.1

using Adwais.Domain;

namespace Adwais.Application.DTOs.GlobalConfig;

public record GlobalConfigResponseDto(
    int Id,
    DateTimeOffset? LastPolled,
    bool OrderFetchEnabled,
    bool MonitoringFetchEnabled,
    int OrderFetchIntervalMinutes,
    IReadOnlyDictionary<string, string?> MonitoringProviderSettings,
    IReadOnlyCollection<string> MonitoringProviderConfiguredSecretKeys,
    int UptimeFetchIntervalMinutes,
    int LatencyFetchIntervalMinutes,
    int UserStatsFetchIntervalMinutes,
    int SystemEventRetentionDays,
    int? MonitorsCount,
    int? MonitorsLimit,
    string? ActiveSubscription,
    int FeedFetchIntervalHours,
    string? WeatherLocation,
    int WeatherFetchIntervalMinutes,
    string ReportingTimeZoneId,
    string MonitoringProvider = IntegrationProviders.UptimeRobot
);
