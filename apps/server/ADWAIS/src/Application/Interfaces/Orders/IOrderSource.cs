using Adwais.Application.DTOs.Financial.Upstream;
using Adwais.Application.DTOs.Integrations;

namespace Adwais.Application.Interfaces;

public interface IOrderSource
{
    string Provider { get; }
    ProviderDescriptor Configuration { get; }
    bool IsConfigured(string? settings);
    IReadOnlyDictionary<string, string?> GetPublicSettings(string? settings);
    IReadOnlyCollection<string> GetConfiguredSecretKeys(string? settings);
    string MergeSettings(string? currentSettings, IReadOnlyDictionary<string, string?> updates);

    Task<IReadOnlyList<OrderSourceOrder>> FetchOrdersAsync(
        string settings,
        DateTimeOffset startDate,
        DateTimeOffset endDate,
        int take,
        CancellationToken ct = default);
}
