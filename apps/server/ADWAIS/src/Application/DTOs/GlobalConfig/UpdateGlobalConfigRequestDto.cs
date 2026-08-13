// Part of the ADWAIS project, under the Business Source License 1.1.
// See /LICENSE for license information.
// SPDX-License-Identifier: BUSL-1.1

namespace Adwais.Application.DTOs.GlobalConfig;

public record UpdateGlobalConfigRequestDto(
    bool? OrderFetchEnabled = null,
    bool? MonitoringFetchEnabled = null,
    Dictionary<string, string?>? MonitoringProviderSettings = null,
    int? SystemEventRetentionDays = null,
    int? FeedFetchIntervalHours = null,
    string? WeatherLocation = null,
    int? WeatherFetchIntervalMinutes = null,
    string? ReportingTimeZoneId = null,
    string? MonitoringProvider = null
);
