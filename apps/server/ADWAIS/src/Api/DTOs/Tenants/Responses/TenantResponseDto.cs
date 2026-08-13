// Part of the ADWAIS project, under the Business Source License 1.1.
// See /LICENSE for license information.
// SPDX-License-Identifier: BUSL-1.1

using Adwais.Api.DTOs.Monitoring;
using Adwais.Domain.Entities;
using Adwais.Domain.Enums;

namespace Adwais.Api.DTOs.Tenants;

public record TenantResponseDto
{
    public Guid Id { get; init; }
    public string Name { get; init; } = string.Empty;
    public TenantType Type { get; init; }
    public string OrderProvider { get; init; } = string.Empty;
    public IReadOnlyDictionary<string, string?> OrderProviderSettings { get; init; } = new Dictionary<string, string?>();
    public IReadOnlyCollection<string> OrderProviderConfiguredSecretKeys { get; init; } = [];
    public string? ImageUrl { get; init; }
    public bool CurrentlyFetching { get; init; }
    public DateTimeOffset? FetchedFrom { get; init; }
    public DateTimeOffset? FetchedUntil { get; init; }
    public DateTimeOffset? LastPolled { get; init; }
    public bool OrderFetchingEnabled { get; init; }
    public int MonitorCount { get; init; }
    public string? LastSyncError { get; init; }
    public bool HasOrderProviderSettings { get; init; }
}


