// Part of the ADWAIS project, under the Business Source License 1.1.
// See /LICENSE for license information.
// SPDX-License-Identifier: BUSL-1.1

namespace Adwais.Application.DTOs.Monitoring.Upstream;

public sealed record MonitoringProviderMonitor(
    string ExternalId,
    string Type,
    string Name,
    string Url,
    string Status,
    DateTimeOffset CreatedDate,
    int UpdateInterval,
    List<string> Tags,
    string? HttpMethod = null,
    int? TimeoutSeconds = null,
    DateTimeOffset? SslExpiresAt = null,
    DateTimeOffset? DomainExpiresAt = null,
    List<string>? MonitoredRegions = null,
    long? CurrentStateDurationSeconds = null,
    MonitoringProviderIncident? LastIncident = null);

public sealed record MonitoringProviderIncident(
    string? ExternalId,
    string? Status,
    string? Cause,
    string? Reason,
    DateTimeOffset? StartedAt,
    long? DurationSeconds);

public sealed record MonitoringProviderAccount(
    string Email,
    string FullName,
    int MonitorsCount,
    int MonitorLimit,
    string ActiveSubscriptionPlan);
