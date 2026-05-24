using Domain.Entities.Monitoring;
using Infrastructure.CacheModels;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;

namespace Infrastructure.Services.Monitoring;

/// <summary>
/// Orchestrates uptime monitor management, including creation, assignment, and status hydration.
/// </summary>
public class MonitorOrchestrationService(
    AnalyticsDbContext dbContext,
    IUptimeRobotService uptimeRobotService,
    IMemoryCache cache) : IMonitorOrchestrationService
{
    /// <inheritdoc />
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

        return HydrateLiveStatus(monitor);
    }

    /// <inheritdoc />
    public async Task AssignMonitorAsync(int monitorId, Guid tenantId)
    {
        var monitor = await dbContext.Monitors.SingleOrDefaultAsync(m => m.Id == monitorId);
        if (monitor == null) throw new KeyNotFoundException($"Monitor {monitorId} not found.");

        var tenantExists = await dbContext.Tenants.AnyAsync(t => t.Id == tenantId);
        if (!tenantExists) throw new KeyNotFoundException($"Tenant {tenantId} not found.");

        monitor.TenantId = tenantId;
        await dbContext.SaveChangesAsync();
    }

    /// <inheritdoc />
    public async Task ReassignAllTenantMonitorsToSystemAsync(Guid tenantId)
    {
        await dbContext.Monitors
            .Where(m => m.TenantId == tenantId)
            .ExecuteUpdateAsync(s => s.SetProperty(m => m.TenantId, AnalyticsDbContext.SystemTenantGuid));
    }

    /// <inheritdoc />
    public async Task<IEnumerable<UptimeMonitor>> GetMonitorsByTenantAsync(Guid tenantId)
    {
        var monitors = await dbContext.Monitors
            .AsNoTracking()
            .Where(m => m.TenantId == tenantId)
            .ToListAsync();

        return monitors.Select(HydrateLiveStatus);
    }

    /// <inheritdoc />
    public async Task<UptimeMonitor> GetMonitorAsync(Guid tenantId, int id)
    {
        var monitor = await dbContext.Monitors
            .AsNoTracking()
            .SingleOrDefaultAsync(m => m.TenantId == tenantId && m.Id == id);

        if (monitor == null) throw new KeyNotFoundException($"Monitor {id} not found.");

        return HydrateLiveStatus(monitor);
    }
    
    /// <summary>
    /// Hydrates a monitor with its live status from the cache.
    /// </summary>
    private UptimeMonitor HydrateLiveStatus(UptimeMonitor monitor)
    {
        if (cache.TryGetValue(GlobalCacheKeys.MonitorState(monitor.Id), out LiveMonitorState? state) && state != null)
        {
            monitor.StatusStr = FormatStatus(state.StatusStr);
        }
        else
        {
            monitor.StatusStr = "Unknown";
        }
        return monitor;
    }

    /// <summary>
    /// Formats a status string to be more human-readable (sentence case).
    /// </summary>
    private static string FormatStatus(string status) 
    {
        if (string.IsNullOrWhiteSpace(status)) return "Unknown";
        return status.Length > 1 
            ? char.ToUpper(status[0]) + status.Substring(1).ToLower() 
            : status;
    }

    /// <inheritdoc />
    public async Task DeleteMonitorAsync(Guid tenantId, int id)
    {
        var monitor = await dbContext.Monitors.SingleOrDefaultAsync(m => m.TenantId == tenantId && m.Id == id);
        if (monitor == null) throw new KeyNotFoundException();

        await uptimeRobotService.DeleteMonitorAsync(id);

        dbContext.Monitors.Remove(monitor);
        await dbContext.SaveChangesAsync();
    }

    /// <inheritdoc />
    public async Task PauseMonitorAsync(int id)
    {
        var monitor = await dbContext.Monitors.SingleOrDefaultAsync(m => m.Id == id);
        if (monitor == null) throw new KeyNotFoundException();

        await uptimeRobotService.PauseMonitorAsync(id);
        
        monitor.UptimeMonitorEnabled = false;
        await dbContext.SaveChangesAsync();
    }

    /// <inheritdoc />
    public async Task StartMonitorAsync(int id)
    {
        var monitor = await dbContext.Monitors.SingleOrDefaultAsync(m => m.Id == id);
        if (monitor == null) throw new KeyNotFoundException();

        await uptimeRobotService.StartMonitorAsync(id);
        
        monitor.UptimeMonitorEnabled = true;
        await dbContext.SaveChangesAsync();
    }

    /// <inheritdoc />
    public async Task<IEnumerable<ResponseTime>> GetAggregatedLatencyAsync(Guid tenantId, int id, DateTimeOffset from, DateTimeOffset to)
    {
        var monitorExists = await dbContext.Monitors
            .AsNoTracking()
            .AnyAsync(m => m.TenantId == tenantId && m.Id == id);

        if (!monitorExists)
        {
            throw new KeyNotFoundException($"Monitor {id} not found.");
        }

        return await dbContext.ResponseTimes
            .AsNoTracking()
            .Where(rt => rt.MonitorId == id)
            .Where(rt => rt.Date >= from && rt.Date <= to)
            .OrderBy(rt => rt.Date)
            .ToListAsync();
    }

    /// <inheritdoc />
    public async Task<UptimeMonitor> UpdateMonitorSlaAsync(int id, double? uptimeSla)
    {
        var monitor = await dbContext.Monitors.SingleOrDefaultAsync(m => m.Id == id);
        if (monitor == null) throw new KeyNotFoundException();
        
        if (uptimeSla is not null)
        {
            monitor.UptimeSla = uptimeSla;
        }

        await dbContext.SaveChangesAsync();

        return HydrateLiveStatus(monitor);
    }
}
