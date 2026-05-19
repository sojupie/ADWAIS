using Domain.Entities.Monitoring;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Services.Monitoring;

public class MonitorOrchestrationService(
    AnalyticsDbContext dbContext,
    IUptimeRobotService uptimeRobotService) : IMonitorOrchestrationService
{
    public async Task<UptimeMonitor> CreateMonitorAsync(Guid tenantId, string name, string url, double? uptimeSla)
    {
        var tenantExists = await dbContext.Tenants.AnyAsync(t => t.Id == tenantId);
        if (!tenantExists) throw new KeyNotFoundException($"Tenant {tenantId} not found.");

        var monitorExists = await dbContext.Monitors.AnyAsync(m => m.Url == url && m.TenantId == tenantId);
        if (monitorExists) throw new InvalidOperationException($"A monitor with URL {url} already exists.");

        var remoteMonitor = await uptimeRobotService.CreateMonitorAsync(name, url);
        
        var monitor = new UptimeMonitor
        {
            Id = remoteMonitor.Id,
            TenantId = tenantId,
            Name = remoteMonitor.FriendlyName,
            Url = remoteMonitor.Url,
            UpdateInterval = remoteMonitor.UpdateInterval,
            UptimeSla = uptimeSla,
            UptimeMonitorEnabled = true,
            CreatedDate = remoteMonitor.CreatedDate,
            StatusStr = remoteMonitor.Status // Transient property population
        };

        dbContext.Monitors.Add(monitor);
        await dbContext.SaveChangesAsync();

        return monitor;
    }

    public async Task<IEnumerable<UptimeMonitor>> GetMonitorsByTenantAsync(Guid tenantId)
    {
        var monitors = await dbContext.Monitors
            .Where(m => m.TenantId == tenantId)
            .ToListAsync();

        foreach (var monitor in monitors)
        {
            monitor.StatusStr = FormatStatus(monitor.StatusStr);
        }

        return monitors;
    }

    public async Task<UptimeMonitor> GetMonitorAsync(Guid tenantId, int id)
    {
        var monitor = await dbContext.Monitors
            .FirstOrDefaultAsync(m => m.TenantId == tenantId && m.Id == id);

        if (monitor == null) throw new KeyNotFoundException($"Monitor {id} not found.");

        monitor.StatusStr = FormatStatus(monitor.StatusStr);

        return monitor;
    }
    
    private static string FormatStatus(string status) 
    {
        if (string.IsNullOrWhiteSpace(status)) return "Unknown";
        return status.Length > 1 
            ? char.ToUpper(status[0]) + status.Substring(1).ToLower() 
            : status;
    }

    public async Task DeleteMonitorAsync(Guid tenantId, int id)
    {
        var monitor = await dbContext.Monitors.FirstOrDefaultAsync(m => m.TenantId == tenantId && m.Id == id);
        if (monitor == null) throw new KeyNotFoundException();

        await uptimeRobotService.DeleteMonitorAsync(id);

        dbContext.Monitors.Remove(monitor);
        await dbContext.SaveChangesAsync();
    }

    public async Task PauseMonitorAsync(Guid tenantId, int id)
    {
        var monitor = await dbContext.Monitors.FirstOrDefaultAsync(m => m.TenantId == tenantId && m.Id == id);
        if (monitor == null) throw new KeyNotFoundException();

        await uptimeRobotService.PauseMonitorAsync(id);
        
        monitor.UptimeMonitorEnabled = false;
        await dbContext.SaveChangesAsync();
    }

    public async Task StartMonitorAsync(Guid tenantId, int id)
    {
        var monitor = await dbContext.Monitors.FirstOrDefaultAsync(m => m.TenantId == tenantId && m.Id == id);
        if (monitor == null) throw new KeyNotFoundException();

        await uptimeRobotService.StartMonitorAsync(id);
        
        monitor.UptimeMonitorEnabled = true;
        await dbContext.SaveChangesAsync();
    }

    public async Task<IEnumerable<ResponseTime>> GetAggregatedLatencyAsync(Guid tenantId, int id, DateTimeOffset from, DateTimeOffset to)
    {
        throw new NotImplementedException("Materialized view aggregation requires explicit SQL definition.");
    }
}