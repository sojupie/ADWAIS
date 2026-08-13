// Part of the ADWAIS project, under the Business Source License 1.1.
// See /LICENSE for license information.
// SPDX-License-Identifier: BUSL-1.1

namespace Adwais.Application.Interfaces;

public static class ProviderSelectionExtensions
{
    public static IOrderSource ForProvider(this IEnumerable<IOrderSource> sources, string provider)
        => sources.SingleOrDefault(source => source.Provider.Equals(provider, StringComparison.OrdinalIgnoreCase))
           ?? throw new InvalidOperationException($"No order source is registered for provider '{provider}'.");

    public static IMonitoringProvider ForProvider(this IEnumerable<IMonitoringProvider> providers, string provider)
        => providers.SingleOrDefault(candidate => candidate.Provider.Equals(provider, StringComparison.OrdinalIgnoreCase))
           ?? throw new InvalidOperationException($"No monitoring provider is registered for provider '{provider}'.");
}
