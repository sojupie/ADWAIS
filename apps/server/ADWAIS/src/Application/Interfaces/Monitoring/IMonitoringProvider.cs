using Adwais.Application.DTOs.Monitoring.Upstream;

namespace Adwais.Application.Interfaces;

public interface IMonitoringProvider
{
    string Provider { get; }
    bool IsConfigured(string? settings);
    IReadOnlyDictionary<string, string?> GetPublicSettings(string? settings);
    IReadOnlyCollection<string> GetConfiguredSecretKeys(string? settings);
    string MergeSettings(string? currentSettings, IReadOnlyDictionary<string, string?> updates);

    Task<MonitoringProviderMonitor> CreateMonitorAsync(string name, string url, string? type);
    Task UpdateMonitorAsync(string externalId, string? name, string? url, string? type, List<string>? tags);
    Task<List<MonitoringProviderMonitor>> GetMonitorsAsync(IReadOnlyCollection<string>? externalIds = null);
    Task<double> GetUptimeAsync(string externalId, DateTimeOffset? startDate = null, DateTimeOffset? endDate = null, string? monitorName = null);
    Task<(int? Average, int? Lowest, int? Highest)> GetResponseTimeAsync(string externalId, DateTimeOffset? startDate = null, DateTimeOffset? endDate = null, string? monitorName = null);
    Task DeleteMonitorAsync(string externalId);
    Task PauseMonitorAsync(string externalId);
    Task StartMonitorAsync(string externalId);
    Task<MonitoringProviderAccount> GetAccountDetailsAsync();
}
