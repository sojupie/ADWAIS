// Part of the ADWAIS project, under the Business Source License 1.1.
// See /LICENSE for license information.
// SPDX-License-Identifier: BUSL-1.1

using Adwais.Domain;

namespace Adwais.Domain.Entities;

public class GlobalConfig
{
    public int Id { get; set; }
    public DateTimeOffset? LastPolled { get; set; }
    public bool OrderFetchEnabled { get; set; }
    public bool MonitoringFetchEnabled { get; set; }
    public required int OrderFetchIntervalMinutes { get; set; }
    public string MonitoringProvider { get; set; } = IntegrationProviders.UptimeRobot;
    public string? MonitoringProviderSettings { get; set; }
    public int UptimeFetchIntervalMinutes { get; set; }
    public int LatencyFetchIntervalMinutes { get; set; }
    public int UserStatsFetchIntervalMinutes { get; set; }
    public int SystemEventRetentionDays { get; set; }
    
    public int? MonitorsCount { get; set; }
    public int? MonitorsLimit { get; set; }
    public string? ActiveSubscription { get; set; }
    public string? LastSyncError { get; set; }
    public int FeedFetchIntervalHours { get; set; } = 2;
    public string? WeatherLocation { get; set; }
    public int WeatherFetchIntervalMinutes { get; set; } = 15;
    public string ReportingTimeZoneId { get; set; } = "Europe/Stockholm";
}
