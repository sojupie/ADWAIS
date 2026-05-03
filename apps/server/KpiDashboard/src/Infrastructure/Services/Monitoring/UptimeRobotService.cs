using System.Text.Json;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Domain.Entities.Monitoring;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Services.Monitoring;

public class UptimeRobotService(HttpClient httpClient, IDbContextFactory<AnalyticsDbContext> contextFactory) : IUptimeRobotService
{
    private async Task<string> GetApiKeyAsync()
    {
        using var context = await contextFactory.CreateDbContextAsync();
        var config = await context.GlobalConfigs.FirstOrDefaultAsync();
        if (config == null || string.IsNullOrWhiteSpace(config.UptimeRobotApiKey))
        {
            throw new InvalidOperationException("UptimeRobotApiKey is not configured in GlobalConfig.");
        }
        return config.UptimeRobotApiKey;
    }

    private async Task<JsonDocument> GetResponseAsync(HttpRequestMessage request)
    {
        var apiKey = await GetApiKeyAsync();
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
        
        var response = await httpClient.SendAsync(request);
        var responseContent = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
        {
            throw new HttpRequestException(
                $"UptimeRobot request failed with HTTP {(int)response.StatusCode} {response.ReasonPhrase}: {responseContent}"
            );
        }
        return JsonDocument.Parse(responseContent);
    }

    public async Task<int> CreateMonitorAsync(string name, string url)
    {
        var request = new HttpRequestMessage(HttpMethod.Post, "https://api.uptimerobot.com/v3/monitors");
        request.Content = JsonContent.Create(new
        {
            friendlyName = name,
            url,
            type = "HTTP",
            interval = 300,
            timeout = 60
        });
        
        using var response = await GetResponseAsync(request);    
        return response.RootElement.GetProperty("id").GetInt32();
    }    
    
    public async Task<List<UptimeMonitor>> GetAllMonitorsAsync()
    {
        var request = new HttpRequestMessage(HttpMethod.Get, "https://api.uptimerobot.com/v3/monitors");
        using var response = await GetResponseAsync(request);

        var monitors = new List<UptimeMonitor>();

        foreach (var monitor in response.RootElement.GetProperty("data").EnumerateArray())
        {
            var monitorId = monitor.GetProperty("id").GetInt32();

            monitors.Add(new UptimeMonitor
            {
                Name = monitor.GetProperty("friendlyName").GetString() ?? string.Empty,
                Url = monitor.GetProperty("url").GetString() ?? string.Empty,
                // Assuming UptimeMonitor might still use UptimeRobotId locally if schema evolved.
                // It was updated to Id but maybe mapped. If property was removed, we use ID instead.
                Status = new MonitorStatus
                {
                    StatusStr = monitor.GetProperty("status").GetString() ?? "Unknown",
                    Uptime = -1,
                    LastResponseTime = null
                }
            });
        }
        return monitors;
    }
    
    public async Task<double> GetUptimeAsync(int monitorId)
    {
        var request = new HttpRequestMessage(HttpMethod.Get, $"https://api.uptimerobot.com/v3/monitors/{monitorId}/stats/uptime");
        using var response = await GetResponseAsync(request);
        return response.RootElement.GetProperty("uptime").GetDouble();
    }
        
    public async Task<int?> GetResponseTimeAsync(int monitorId)
    {
        var request = new HttpRequestMessage(HttpMethod.Get, $"https://api.uptimerobot.com/v3/monitors/{monitorId}/stats/response-time");
        using var response = await GetResponseAsync(request);
        return response.RootElement.GetProperty("summary").GetProperty("avg").GetInt32();
    }

    public async Task DeleteMonitorAsync(int monitorId)
    {
        var request = new HttpRequestMessage(HttpMethod.Delete, $"https://api.uptimerobot.com/v3/monitors/{monitorId}");
        await GetResponseAsync(request);
    }

    public async Task PauseMonitorAsync(int monitorId)
    {
        var request = new HttpRequestMessage(HttpMethod.Post, $"https://api.uptimerobot.com/v3/monitors/{monitorId}/pause");
        await GetResponseAsync(request);
    }

    public async Task StartMonitorAsync(int monitorId)
    {
        var request = new HttpRequestMessage(HttpMethod.Post, $"https://api.uptimerobot.com/v3/monitors/{monitorId}/start");
        await GetResponseAsync(request);
    }

    public async Task<JsonDocument> GetAccountDetailsAsync()
    {
        var request = new HttpRequestMessage(HttpMethod.Get, "https://api.uptimerobot.com/v3/user/me");
        return await GetResponseAsync(request);
    }
}
