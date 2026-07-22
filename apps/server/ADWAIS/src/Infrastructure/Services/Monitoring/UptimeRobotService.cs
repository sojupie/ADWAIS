using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Adwais.Application.DTOs.Monitoring.Upstream;
using Adwais.Application.Interfaces;
using Adwais.Domain.Entities.Monitoring;
using Adwais.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Adwais.Infrastructure.Services.Monitoring;

public class UptimeRobotService(
    HttpClient httpClient, 
    IDbContextFactory<AnalyticsDbContext> contextFactory,
    ISystemEventService eventService) : IUptimeRobotService
{
    private async Task<string> GetApiKeyAsync()
    {
        using var context = await contextFactory.CreateDbContextAsync();
        var config = await context.GlobalConfigs.SingleOrDefaultAsync();
        if (config == null || string.IsNullOrWhiteSpace(config.UptimeRobotApiKey))
        {
            throw new InvalidOperationException("UptimeRobotApiKey is not configured in GlobalConfig.");
        }
        return config.UptimeRobotApiKey;
    }

    private async Task<JsonDocument> GetResponseAsync(HttpRequestMessage request, string? context = null)
    {
        var apiKey = await GetApiKeyAsync();
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
        
        var response = await httpClient.SendAsync(request);
        var responseContent = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
        {
            var msg = $"UptimeRobot request failed with HTTP {(int)response.StatusCode}";
            if (!string.IsNullOrEmpty(context)) msg += $" ({context})";
            
            await eventService.LogErrorAsync(nameof(UptimeRobotService), msg, new Exception(responseContent));
            throw new HttpRequestException($"{msg}: {responseContent}");
        }
        return JsonDocument.Parse(responseContent);
    }

    public async Task<UptimeRobotMonitorDto> CreateMonitorAsync(string name, string url, string? type)
    {
        var normalizedType = UptimeMonitorTypes.Normalize(type);
        var request = new HttpRequestMessage(HttpMethod.Post, "https://api.uptimerobot.com/v3/monitors");
        request.Content = JsonContent.Create(new { friendlyName = name, url, type = normalizedType, interval = 300, timeout = 60 });
        using var response = await GetResponseAsync(request, $"Create: {name}");
        
        var monitor = new UptimeRobotMonitorDto(
            Id: response.RootElement.GetProperty("id").GetInt32(),
            Type: ParseType(response.RootElement, normalizedType),
            FriendlyName: response.RootElement.GetProperty("friendlyName").GetString()!,
            Url: response.RootElement.GetProperty("url").GetString()!,
            Status: response.RootElement.GetProperty("status").GetString()!,
            CreatedDate: response.RootElement.GetProperty("createDateTime").GetDateTimeOffset(),
            UpdateInterval: response.RootElement.GetProperty("interval").GetInt32(),
            Tags: ParseTags(response.RootElement)
        );
        return monitor;
    }

    public async Task UpdateMonitorAsync(int monitorId, string? name, string? url, string? type, List<string>? tags)
    {
        var payload = new Dictionary<string, object>();
        if (name != null)
        {
            payload.Add("friendlyName", name);
        }
        if (url != null)
        {
            payload.Add("url", url);
        }
        if (type != null)
        {
            payload.Add("type", UptimeMonitorTypes.Normalize(type));
        }
        if (tags != null)
        {
            payload.Add("tagNames", tags);
        }

        if (payload.Count == 0)
        {
            return;
        }

        var request = new HttpRequestMessage(HttpMethod.Patch, $"https://api.uptimerobot.com/v3/monitors/{monitorId}")
        {
            Content = JsonContent.Create(payload)
        };
        using var response = await GetResponseAsync(request, $"Update: {name ?? "Unspecified"} ({monitorId})");
    }

    public async Task<List<UptimeRobotMonitorDto>> GetMonitorsAsync(int[]? monitorIds = null)
    {
        var monitors = new List<UptimeRobotMonitorDto>();
        var baseUrl = "https://api.uptimerobot.com/v3/monitors";
        var queryParams = new List<string> { "limit=200" };

        if (monitorIds is { Length: > 0 })
        {
            queryParams.Add($"monitors={string.Join("-", monitorIds)}");
        }

        var nextUrl = $"{baseUrl}?{string.Join("&", queryParams)}";
        var context = "GetMonitors";

        while (!string.IsNullOrEmpty(nextUrl))
        {
            var request = new HttpRequestMessage(HttpMethod.Get, nextUrl);
            using var response = await GetResponseAsync(request, context);

            if (response.RootElement.TryGetProperty("data", out var dataProp) && dataProp.ValueKind == JsonValueKind.Array)
            {
                foreach (var monitor in dataProp.EnumerateArray())
                {
                    monitors.Add(new UptimeRobotMonitorDto(
                        Id: monitor.GetProperty("id").GetInt32(),
                        Type: ParseType(monitor),
                        FriendlyName: monitor.GetProperty("friendlyName").GetString()!,
                        Url: monitor.GetProperty("url").GetString()!,
                        Status: monitor.GetProperty("status").GetString()!,
                        CreatedDate: monitor.GetProperty("createDateTime").GetDateTimeOffset(),
                        UpdateInterval: monitor.GetProperty("interval").GetInt32(),
                        Tags: ParseTags(monitor)
                    ));
                }
            }

            nextUrl = null;
            if (response.RootElement.TryGetProperty("nextLink", out var nextLinkProp) && nextLinkProp.ValueKind == JsonValueKind.String)
            {
                var link = nextLinkProp.GetString();
                if (!string.IsNullOrWhiteSpace(link))
                {
                    nextUrl = link.StartsWith("http", StringComparison.OrdinalIgnoreCase)
                        ? link
                        : "https://api.uptimerobot.com" + (link.StartsWith("/") ? link : "/" + link);
                }
            }
        }

        return monitors;
    }

    private static List<string> ParseTags(JsonElement monitorElement)
    {
        var tagsList = new List<string>();
        if (monitorElement.TryGetProperty("tags", out var tagsElement) && tagsElement.ValueKind == JsonValueKind.Array)
        {
            foreach (var tag in tagsElement.EnumerateArray())
            {
                if (tag.TryGetProperty("name", out var nameElement) && nameElement.ValueKind == JsonValueKind.String)
                {
                    var tagName = nameElement.GetString();
                    if (!string.IsNullOrEmpty(tagName))
                    {
                        tagsList.Add(tagName);
                    }
                }
            }
        }
        return tagsList;
    }

    private static string ParseType(JsonElement monitorElement, string fallback = UptimeMonitorTypes.Http)
    {
        if (!monitorElement.TryGetProperty("type", out var typeElement))
        {
            return fallback;
        }

        return typeElement.ValueKind switch
        {
            JsonValueKind.String => UptimeMonitorTypes.Normalize(typeElement.GetString()),
            JsonValueKind.Number => typeElement.GetRawText(),
            _ => fallback
        };
    }
    
    public async Task<double> GetUptimeAsync(int monitorId, DateTimeOffset? startDate = null, DateTimeOffset? endDate = null, string? monitorName = null)
    {
        var url = $"https://api.uptimerobot.com/v3/monitors/{monitorId}/stats/uptime";
        if (startDate.HasValue && endDate.HasValue)
        {
            var fromStr = startDate.Value.ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ");
            var toStr = endDate.Value.ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ");
            url += $"?from={fromStr}&to={toStr}";
        }
        var request = new HttpRequestMessage(HttpMethod.Get, url);
        using var response = await GetResponseAsync(request, monitorName != null ? $"Monitor: {monitorName}" : $"MonitorId: {monitorId}");
        return response.RootElement.GetProperty("uptime").GetDouble();
    }
        
    public async Task<(int? Average, int? Lowest, int? Highest)> GetResponseTimeAsync(int monitorId, DateTimeOffset? startDate = null, DateTimeOffset? endDate = null, string? monitorName = null)
    {
        var url = $"https://api.uptimerobot.com/v3/monitors/{monitorId}/stats/response-time";
        if (startDate.HasValue && endDate.HasValue)
        {
            var fromStr = startDate.Value.ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ");
            var toStr = endDate.Value.ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ");
            url += $"?from={fromStr}&to={toStr}";
        }
        var request = new HttpRequestMessage(HttpMethod.Get, url);
        using var response = await GetResponseAsync(request, monitorName != null ? $"Monitor: {monitorName}" : $"MonitorId: {monitorId}");
        var summary = response.RootElement.GetProperty("summary");
        
        int? avg = summary.TryGetProperty("avg", out var avgProp) && avgProp.ValueKind != JsonValueKind.Null ? avgProp.GetInt32() : null;
        int? lowest = summary.TryGetProperty("min", out var minProp) && minProp.ValueKind != JsonValueKind.Null ? minProp.GetInt32() : null;
        int? highest = summary.TryGetProperty("max", out var maxProp) && maxProp.ValueKind != JsonValueKind.Null ? maxProp.GetInt32() : null;

        return (avg, lowest, highest);
    }

    public async Task DeleteMonitorAsync(int monitorId)
    {
        var request = new HttpRequestMessage(HttpMethod.Delete, $"https://api.uptimerobot.com/v3/monitors/{monitorId}");
        await GetResponseAsync(request, $"Delete MonitorId: {monitorId}");
    }

    public async Task PauseMonitorAsync(int monitorId)
    {
        var request = new HttpRequestMessage(HttpMethod.Post, $"https://api.uptimerobot.com/v3/monitors/{monitorId}/pause");
        request.Content = new StringContent(string.Empty, System.Text.Encoding.UTF8, "application/json");
        await GetResponseAsync(request, $"Pause MonitorId: {monitorId}");
    }

    public async Task StartMonitorAsync(int monitorId)
    {
        var request = new HttpRequestMessage(HttpMethod.Post, $"https://api.uptimerobot.com/v3/monitors/{monitorId}/start");
        request.Content = new StringContent(string.Empty, System.Text.Encoding.UTF8, "application/json");
        await GetResponseAsync(request, $"Start MonitorId: {monitorId}");
    }

    public async Task<UptimeRobotUserDto> GetAccountDetailsAsync()
    {
        var request = new HttpRequestMessage(HttpMethod.Get, "https://api.uptimerobot.com/v3/user/me");
        using var response = await GetResponseAsync(request, "GetAccountDetails");
        
        var root = response.RootElement;
        var sub = root.GetProperty("activeSubscription");

        return new UptimeRobotUserDto(
            Email: root.GetProperty("email").GetString()!,
            FullName: root.GetProperty("fullName").GetString()!,
            MonitorsCount: root.GetProperty("monitorsCount").GetInt32(),
            MonitorLimit: root.GetProperty("monitorLimit").GetInt32(),
            ActiveSubscriptionPlan: sub.GetProperty("plan").GetString()!
        );
    }
}


