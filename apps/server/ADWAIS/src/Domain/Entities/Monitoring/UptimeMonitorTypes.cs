namespace Adwais.Domain.Entities.Monitoring;

public static class UptimeMonitorTypes
{
    public const string Http = "HTTP";

    public static string Normalize(string? type) =>
        string.IsNullOrWhiteSpace(type) ? Http : type.Trim().ToUpperInvariant();
}
