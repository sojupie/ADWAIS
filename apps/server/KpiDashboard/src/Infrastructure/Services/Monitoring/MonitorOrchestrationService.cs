using Domain.Entities.Monitoring;
using Domain.DTOs.Monitoring;
using Domain.Enums;
using Infrastructure.CacheModels;
using Infrastructure.Services.Financial;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;

namespace Infrastructure.Services.Monitoring;

public class MonitorOrchestrationService(
    AnalyticsDbContext dbContext,
    IUptimeRobotService uptimeRobotService,
    IMemoryCache cache) : IMonitorOrchestrationService
{
    private record LatencyRow(DateTime Timestamp, double Average, double Lowest, double Highest);

    public async Task<MonitorAnalyticsDto> GetAnalyticsAsync(Timeframe timeframe, Guid? tenantId = null, int? monitorId = null)
    {
        var (currentStart, currentEnd, previousStart, steps, isHourly, includeActualTime) = TimeframeResolver.Resolve(timeframe);

        var currentRows = await GetMergedLatencyDataAsync(dbContext, currentStart, currentEnd, isHourly, tenantId, monitorId);
        var previousRows = await GetMergedLatencyDataAsync(dbContext, previousStart, currentStart, isHourly, tenantId, monitorId);

        var currentByStep = currentRows
            .GroupBy(r => isHourly ? (int)(r.Timestamp - currentStart.UtcDateTime).TotalHours : (int)(r.Timestamp - currentStart.UtcDateTime).TotalDays)
            .ToDictionary(
                g => g.Key, 
                g => new { 
                    Avg = g.Average(r => r.Average), 
                    Min = g.Min(r => r.Lowest), 
                    Max = g.Max(r => r.Highest) 
                });

        var previousByStep = previousRows
            .GroupBy(r => isHourly ? (int)(r.Timestamp - previousStart.UtcDateTime).TotalHours : (int)(r.Timestamp - previousStart.UtcDateTime).TotalDays)
            .ToDictionary(g => g.Key, g => g.Average(r => r.Average));

        var latencyPoints = new List<LatencyPointDto>(steps);
        for (var i = 0; i < steps; i++)
        {
            var timestamp = isHourly ? currentStart.AddHours(i) : currentStart.AddDays(i);
            var isLast = i == steps - 1;
            var label = isHourly 
                ? (isLast && includeActualTime ? currentEnd.ToString("HH:mm") : timestamp.ToString("HH:mm")) 
                : $"Day {i + 1}";
            
            var data = currentByStep.GetValueOrDefault(i);
            var prevAvg = previousByStep.GetValueOrDefault(i, 0.0);

            latencyPoints.Add(new LatencyPointDto(
                label, 
                timestamp, 
                data?.Avg ?? 0, 
                prevAvg,
                data?.Min ?? 0, 
                data?.Max ?? 0));
        }
        
        IQueryable<UptimeMonitor> monitorQuery = dbContext.Monitors.AsNoTracking().Include(m => m.Tenant);
        if (monitorId.HasValue) 
            monitorQuery = monitorQuery.Where(m => m.Id == monitorId.Value);
        else if (tenantId.HasValue) 
            monitorQuery = monitorQuery.Where(m => m.TenantId == tenantId.Value);
        else 
            monitorQuery = monitorQuery.Where(m => m.TenantId != AnalyticsDbContext.SystemTenantGuid);

        var monitors = await monitorQuery.ToListAsync();

        var periodUptimes = await GetPeriodUptimesAsync(currentStart, currentEnd, tenantId, monitorId);

        foreach (var m in monitors)
        {
            HydrateLiveStatus(m);
            if (periodUptimes.TryGetValue(m.Id, out var periodUptime))
            {
                m.CurrentUptimePercentage = periodUptime;
            }
        }

        double? globalAvgLatency = null;
        if (monitors.Any(m => m.CurrentLatency.HasValue))
        {
            globalAvgLatency = monitors.Where(m => m.CurrentLatency.HasValue).Average(m => m.CurrentLatency!.Value);
        }

        return new MonitorAnalyticsDto(globalAvgLatency, latencyPoints, monitors);
    }

    private async Task<Dictionary<int, double>> GetPeriodUptimesAsync(DateTimeOffset start, DateTimeOffset end, Guid? tenantId, int? monitorId)
    {
        var yesterday = new DateTimeOffset(DateTimeOffset.UtcNow.Date);
        var viewEnd = yesterday < end ? yesterday : end;

        IQueryable<DailyAvailabilityMonitorRollup> histQuery = dbContext.DailyAvailabilityMonitorRollups
            .AsNoTracking()
            .Where(r => r.Date >= start && r.Date < viewEnd);

        if (monitorId.HasValue)
            histQuery = histQuery.Where(r => r.MonitorId == monitorId.Value);
        else if (tenantId.HasValue)
            histQuery = histQuery.Where(r => r.UptimeMonitor.TenantId == tenantId.Value);
        else
            histQuery = histQuery.Where(r => r.UptimeMonitor.TenantId != AnalyticsDbContext.SystemTenantGuid);

        var historicalDaily = await histQuery
            .GroupBy(r => r.MonitorId)
            .Select(g => new { MonitorId = g.Key, Avg = g.Average(r => r.UptimePercentage ?? 0), Count = g.Count() })
            .ToListAsync();

        var todayLive = new Dictionary<int, double>();
        if (yesterday < end)
        {
            IQueryable<MonitorAvailability> liveQuery = dbContext.MonitorAvailabilities
                .AsNoTracking()
                .Where(ma => ma.Date >= yesterday && ma.Date < end);

            if (monitorId.HasValue)
                liveQuery = liveQuery.Where(ma => ma.MonitorId == monitorId.Value);
            else if (tenantId.HasValue)
                liveQuery = liveQuery.Where(ma => ma.UptimeMonitor!.TenantId == tenantId.Value);
            else
                liveQuery = liveQuery.Where(ma => ma.UptimeMonitor!.TenantId != AnalyticsDbContext.SystemTenantGuid);

            todayLive = await liveQuery
                .ToDictionaryAsync(ma => ma.MonitorId, ma => ma.UptimePercentage);
        }

        var results = new Dictionary<int, double>();
        var allMonitorIds = historicalDaily.Select(x => x.MonitorId).Union(todayLive.Keys);

        foreach (var mid in allMonitorIds)
        {
            var hist = historicalDaily.FirstOrDefault(x => x.MonitorId == mid);
            var histSum = (hist?.Avg ?? 0) * (hist?.Count ?? 0);
            var today = todayLive.GetValueOrDefault(mid, 0);
            
            var count = (hist?.Count ?? 0) + (todayLive.ContainsKey(mid) ? 1 : 0);
            results[mid] = count > 0 ? (histSum + today) / count : 0;
        }

        return results;
    }

    private async Task<List<LatencyRow>> GetMergedLatencyDataAsync(
        AnalyticsDbContext db, DateTimeOffset start, DateTimeOffset end, bool isHourly, Guid? tenantId = null, int? monitorId = null)
    {
        if (isHourly)
        {
            var query = db.ResponseTimes.AsNoTracking().Where(rt => rt.Date >= start && rt.Date < end);
            if (monitorId.HasValue) 
                query = query.Where(rt => rt.MonitorId == monitorId.Value);
            else if (tenantId.HasValue) 
                query = query.Where(rt => rt.UptimeMonitor!.TenantId == tenantId.Value);
            else 
                query = query.Where(rt => rt.UptimeMonitor!.TenantId != AnalyticsDbContext.SystemTenantGuid);

            var grouped = await query
                .GroupBy(rt => new { rt.Date.Year, rt.Date.Month, rt.Date.Day, rt.Date.Hour })
                .Select(g => new LatencyRow(
                    new DateTime(g.Key.Year, g.Key.Month, g.Key.Day, g.Key.Hour, 0, 0),
                    g.Average(rt => rt.Average ?? 0),
                    g.Min(rt => rt.Lowest ?? 0),
                    g.Max(rt => rt.Highest ?? 0)
                ))
                .ToListAsync();
            return grouped;
        }

        var yesterday = new DateTimeOffset(DateTimeOffset.UtcNow.Date);
        var viewEnd = yesterday < end ? yesterday : end;

        var histQuery = db.DailyLatencyMonitorRollups.AsNoTracking().Where(r => r.Date >= start && r.Date < viewEnd);
        if (monitorId.HasValue)
            histQuery = histQuery.Where(r => r.MonitorId == monitorId.Value);
        else if (tenantId.HasValue)
            histQuery = histQuery.Where(r => r.UptimeMonitor.TenantId == tenantId.Value);
        else
            histQuery = histQuery.Where(r => r.UptimeMonitor.TenantId != AnalyticsDbContext.SystemTenantGuid);

        var historical = await histQuery
            .Select(r => new LatencyRow(r.Date.DateTime, r.Average ?? 0, r.Lowest ?? 0, r.Highest ?? 0))
            .ToListAsync();

        if (yesterday < end)
        {
            var liveQuery = db.ResponseTimes.AsNoTracking().Where(rt => rt.Date >= yesterday && rt.Date < end);
            if (monitorId.HasValue)
                liveQuery = liveQuery.Where(rt => rt.MonitorId == monitorId.Value);
            else if (tenantId.HasValue)
                liveQuery = liveQuery.Where(rt => rt.UptimeMonitor!.TenantId == tenantId.Value);
            else
                liveQuery = liveQuery.Where(rt => rt.UptimeMonitor!.TenantId != AnalyticsDbContext.SystemTenantGuid);

            var fresh = await liveQuery
                .GroupBy(rt => rt.Date.Date)
                .Select(g => new LatencyRow(
                    g.Key,
                    g.Average(rt => rt.Average ?? 0),
                    g.Min(rt => rt.Lowest ?? 0),
                    g.Max(rt => rt.Highest ?? 0)
                ))
                .ToListAsync();
            historical.AddRange(fresh);
        }

        return historical;
    }

    public async Task<UptimeMonitor> CreateMonitorAsync(Guid tenantId, string name, string url, double? uptimeSla)
    {
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
            StatusStr = remoteMonitor.Status
        };

        dbContext.Monitors.Add(monitor);
        await dbContext.SaveChangesAsync();

        HydrateLiveStatus(monitor);
        return monitor;
    }

    public async Task AssignMonitorAsync(int monitorId, Guid tenantId)
    {
        var monitor = await dbContext.Monitors.SingleOrDefaultAsync(m => m.Id == monitorId);
        if (monitor == null) throw new KeyNotFoundException($"Monitor {monitorId} not found.");

        var tenantExists = await dbContext.Tenants.AnyAsync(t => t.Id == tenantId);
        if (!tenantExists) throw new KeyNotFoundException($"Tenant {tenantId} not found.");

        monitor.TenantId = tenantId;
        await dbContext.SaveChangesAsync();
    }

    public async Task ReassignAllTenantMonitorsToSystemAsync(Guid tenantId)
    {
        await dbContext.Monitors
            .Where(m => m.TenantId == tenantId)
            .ExecuteUpdateAsync(s => s.SetProperty(m => m.TenantId, AnalyticsDbContext.SystemTenantGuid));
    }

    public async Task<IEnumerable<UptimeMonitor>> GetMonitorsByTenantAsync(Guid tenantId, Timeframe timeframe = Timeframe.T30)
    {
        var (start, end, _, _, _, _) = TimeframeResolver.Resolve(timeframe);
        
        var monitors = await dbContext.Monitors
            .AsNoTracking()
            .Include(m => m.Tenant)
            .Where(m => m.TenantId == tenantId)
            .ToListAsync();

        var uptimes = await GetPeriodUptimesAsync(start, end, tenantId, null);

        foreach (var m in monitors)
        {
            HydrateLiveStatus(m);
            if (uptimes.TryGetValue(m.Id, out var uptime))
            {
                m.CurrentUptimePercentage = uptime;
            }
        }

        return monitors;
    }

    public async Task<UptimeMonitor> GetMonitorAsync(Guid tenantId, int id, Timeframe timeframe = Timeframe.T30)
    {
        var (start, end, _, _, _, _) = TimeframeResolver.Resolve(timeframe);

        var monitor = await dbContext.Monitors
            .AsNoTracking()
            .Include(m => m.Tenant)
            .SingleOrDefaultAsync(m => m.TenantId == tenantId && m.Id == id);

        if (monitor == null) throw new KeyNotFoundException($"Monitor {id} not found.");

        var uptimes = await GetPeriodUptimesAsync(start, end, null, id);
        if (uptimes.TryGetValue(id, out var uptime))
        {
            monitor.CurrentUptimePercentage = uptime;
        }

        HydrateLiveStatus(monitor);
        return monitor;
    }
    
    private void HydrateLiveStatus(UptimeMonitor monitor)
    {
        if (cache.TryGetValue(GlobalCacheKeys.MonitorState(monitor.Id), out LiveMonitorState? state) && state != null)
        {
            monitor.StatusStr = FormatStatus(state.StatusStr);
            monitor.CurrentLatency = state.CurrentLatency;
        }
        else
        {
            // TODO: TEMPORARY — Remove this block when real UptimeRobot monitors are connected.
            // Provides synthetic status/latency for seeded monitors that have no live cache entry.
            monitor.StatusStr = "Up";
            monitor.CurrentLatency = 200 + (monitor.Id % 400); // Deterministic fake latency 200-599ms
        }
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
        var monitor = await dbContext.Monitors.SingleOrDefaultAsync(m => m.TenantId == tenantId && m.Id == id);
        if (monitor == null) throw new KeyNotFoundException();

        await uptimeRobotService.DeleteMonitorAsync(id);

        dbContext.Monitors.Remove(monitor);
        await dbContext.SaveChangesAsync();
    }

    public async Task PauseMonitorAsync(int id)
    {
        var monitor = await dbContext.Monitors.SingleOrDefaultAsync(m => m.Id == id);
        if (monitor == null) throw new KeyNotFoundException();

        await uptimeRobotService.PauseMonitorAsync(id);
        
        monitor.UptimeMonitorEnabled = false;
        await dbContext.SaveChangesAsync();
    }

    public async Task StartMonitorAsync(int id)
    {
        var monitor = await dbContext.Monitors.SingleOrDefaultAsync(m => m.Id == id);
        if (monitor == null) throw new KeyNotFoundException();

        await uptimeRobotService.StartMonitorAsync(id);
        
        monitor.UptimeMonitorEnabled = true;
        await dbContext.SaveChangesAsync();
    }

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

    public async Task<UptimeMonitor> UpdateMonitorSlaAsync(int id, double? uptimeSla)
    {
        var monitor = await dbContext.Monitors.SingleOrDefaultAsync(m => m.Id == id);
        if (monitor == null) throw new KeyNotFoundException();
        
        if (uptimeSla is not null)
        {
            monitor.UptimeSla = uptimeSla;
        }

        await dbContext.SaveChangesAsync();

        HydrateLiveStatus(monitor);
        return monitor;
    }
}
