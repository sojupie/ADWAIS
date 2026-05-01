using System.Text.Json;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Domain.Entities.Monitoring;
using Microsoft.Extensions.Configuration;
using Monitor = Domain.Entities.Monitoring.Monitor;

namespace UptimeRobot_Service.Services;

public class UptimeRobotService(HttpClient httpClient, IConfiguration configuration)
{
    public async Task<int> CreateMonitor(string name, string url)
    {
        var apiKey = configuration["UptimeRobot:ApiKey"];
        
        var request = new HttpRequestMessage(
            HttpMethod.Post,
            "https://api.uptimerobot.com/v3/monitors"
        );
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
        request.Content = JsonContent.Create(new
        {
            friendlyName = name,
            url,
            type = "HTTP",
            interval = 300,
            timeout = 60
        });
        
        using var response = await GetResponse(request);    
        return response.RootElement.GetProperty("id").GetInt32();
    }    
    
    
    private async Task<JsonDocument> GetResponse(HttpRequestMessage request)
    {
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
    
    public async Task<List<Monitor>> GetAllMonitors()
    {
        var apiKey = configuration["UptimeRobot:ApiKey"];
        var request = new HttpRequestMessage(
            HttpMethod.Get,
            "https://api.uptimerobot.com/v3/monitors"
        );
        request.Headers.Authorization =
            new AuthenticationHeaderValue("Bearer", apiKey);

        using var response = await GetResponse(request);

        var monitors = new List<Monitor>();

        foreach (var monitor in response.RootElement.GetProperty("data").EnumerateArray())
        {
            var monitorId = monitor.GetProperty("id").GetInt32();

            monitors.Add(new Monitor
            {
                Name = monitor.GetProperty("friendlyName").GetString(),
                Url = monitor.GetProperty("url").GetString(),
                SlaTarget = 99.9, //need to acquire this from a database or smth
                UptimeRobotId = monitorId,
                Status = new MonitorStatus
                {
                    StatusStr = monitor.GetProperty("status").GetString(),
                    Uptime = -1,
                    LastResponseTime = null
                    
                }
            });
        }
        return monitors;
    }
    
    public Boolean HasApiKey() {
        var apiKey = configuration["UptimeRobot:ApiKey"];
        return (!string.IsNullOrWhiteSpace(apiKey));
    }
    
    private async Task<double> GetUptime(int monitorId)
    {
        var apiKey = configuration["UptimeRobot:ApiKey"];
        var request = new HttpRequestMessage(
            HttpMethod.Get,
                "https://api.uptimerobot.com/v3/monitors/" + monitorId + "/stats/uptime"
        );
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
        using var response = await GetResponse(request);

        return response.RootElement.GetProperty("uptime").GetDouble();
    }
        
    private async Task<int?> GetResponseTime(int monitorId)
    {
        var apiKey = configuration["UptimeRobot:ApiKey"];
        var request = new HttpRequestMessage(
            HttpMethod.Get,
            "https://api.uptimerobot.com/v3/monitors/" + monitorId + "/stats/response-time"
        );
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
        
        using var response = await GetResponse(request);
        var res = response.RootElement.GetProperty("summary").GetProperty("avg").GetInt32();
        return res;
    }
}
