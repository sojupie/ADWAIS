using Adwais.Domain.Entities;
using Adwais.Application.Common.Models;
using Adwais.Domain.Entities.Monitoring;
using Adwais.Application.DTOs.Monitoring;
using Adwais.Domain.Enums;
using Adwais.Application.Common.Caching;
using Adwais.Application.Common.Interfaces;
using Adwais.Application.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;


namespace Adwais.Application.Services;

public class MonitorOrchestrationService(
    IApplicationDbContext dbContext,
    IUptimeRobotService uptimeRobotService,
    ICacheService cache,
    IConfiguration configuration) : IMonitorOrchestrationService
{
    private record LatencyRow(DateTime Timestamp, double Average, double Lowest, double Highest);

    public async Task<MonitorAnalyticsDto> GetAnalyticsAsync(ResolvedPeriod period, Guid? tenantId = null, int? monitorId = null, CancellationToken ct = default)
    {
        var currentStart = period.CurrentStart;
        var currentEnd = period.CurrentEnd;
        var previousStart = period.PreviousStart;
        var steps = period.StepsInPeriod;
        var isHourly = period.IsHourly;
        var includeActualTime = period.IncludeActualTime;

        var currentRows = await GetMergedLatencyDataAsync(dbContext, currentStart, currentEnd, isHourly, tenantId, monitorId, ct);
        var previousRows = await GetMergedLatencyDataAsync(dbContext, previousStart, period.PreviousEnd, isHourly, tenantId, monitorId, ct);

        var roundedTotalHours = Math.Ceiling((currentEnd - currentStart).TotalHours);
        var binSizeHours = isHourly 
            ? roundedTotalHours / steps 
            : 24;

        var currentByStep = currentRows
            .GroupBy(r => (int)((r.Timestamp - currentStart.UtcDateTime).TotalHours / binSizeHours))
            .ToDictionary(
                g => g.Key, 
                g => new { 
                    Avg = g.Average(r => r.Average), 
                    Min = g.Min(r => r.Lowest), 
                    Max = g.Max(r => r.Highest) 
                });

        var previousByStep = previousRows
            .GroupBy(r => (int)((r.Timestamp - previousStart.UtcDateTime).TotalHours / binSizeHours))
            .ToDictionary(g => g.Key, g => g.Average(r => r.Average));

        var latencyPoints = new List<LatencyPointDto>(steps);
        for (var i = 0; i < steps; i++)
        {
            var timestamp = isHourly 
                ? currentStart.AddHours((i + 1) * binSizeHours) 
                : currentStart.AddDays(i);

            if (isHourly && i == steps - 1)
            {
                timestamp = currentEnd;
            }
            
            var data = currentByStep.GetValueOrDefault(i);
            var prevAvg = previousByStep.GetValueOrDefault(i, 0.0);

            latencyPoints.Add(new LatencyPointDto(
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
            monitorQuery = monitorQuery.Where(m => m.TenantId != IApplicationDbContext.SystemTenantGuid);

        var monitors = await monitorQuery.ToListAsync(ct);

        var periodUptimes = await GetPeriodUptimesAsync(currentStart, currentEnd, tenantId, monitorId, ct);

        foreach (var m in monitors)
        {
            HydrateLiveStatus(m);
            if (periodUptimes.TryGetValue(m.Id, out var periodUptime))
            {
                m.CurrentUptimePercentage = periodUptime;
            }
        }

        var previousPeriodUptimes = await GetPeriodUptimesAsync(previousStart, period.PreviousEnd, tenantId, monitorId, ct);

        var currentEnabledUptimes = monitors
            .Where(m => m.UptimeMonitorEnabled && periodUptimes.TryGetValue(m.Id, out var u) && u.HasValue)
            .Select(m => periodUptimes[m.Id]!.Value)
            .ToList();

        var previousEnabledUptimes = monitors
            .Where(m => m.UptimeMonitorEnabled && previousPeriodUptimes.TryGetValue(m.Id, out var u) && u.HasValue)
            .Select(m => previousPeriodUptimes[m.Id]!.Value)
            .ToList();

        double avgUptime = currentEnabledUptimes.Count > 0 ? currentEnabledUptimes.Average() : 0.0;
        double previousAvgUptime = previousEnabledUptimes.Count > 0 ? previousEnabledUptimes.Average() : 0.0;
        double uptimeGrowth = CalculateGrowthPercentage(avgUptime, previousAvgUptime);

        double avgLatency = currentRows.Count > 0 ? currentRows.Average(r => r.Average) : 0.0;
        double prevAvgLatency = previousRows.Count > 0 ? previousRows.Average(r => r.Average) : 0.0;
        double latencyGrowth = CalculateGrowthPercentage(avgLatency, prevAvgLatency);

        double highestLatency = currentRows.Count > 0 ? currentRows.Max(r => r.Highest) : 0.0;
        double prevHighestLatency = previousRows.Count > 0 ? previousRows.Max(r => r.Highest) : 0.0;
        double highestLatencyGrowth = CalculateGrowthPercentage(highestLatency, prevHighestLatency);

        double lowestLatency = currentRows.Count > 0 ? currentRows.Min(r => r.Lowest) : 0.0;
        double prevLowestLatency = previousRows.Count > 0 ? previousRows.Min(r => r.Lowest) : 0.0;
        double lowestLatencyGrowth = CalculateGrowthPercentage(lowestLatency, prevLowestLatency);

        var kpis = new MonitorKpiDto(
            avgUptime,
            previousAvgUptime,
            uptimeGrowth,
            avgLatency,
            prevAvgLatency,
            latencyGrowth,
            highestLatency,
            prevHighestLatency,
            highestLatencyGrowth,
            lowestLatency,
            prevLowestLatency,
            lowestLatencyGrowth
        );

        double? globalAvgLatency = null;
        if (monitors.Any(m => m.CurrentLatency.HasValue))
        {
            globalAvgLatency = monitors.Where(m => m.CurrentLatency.HasValue).Average(m => m.CurrentLatency!.Value);
        }

        return new MonitorAnalyticsDto(globalAvgLatency, latencyPoints, monitors, kpis);
    }

    private async Task<Dictionary<int, double?>> GetPeriodUptimesAsync(DateTimeOffset start, DateTimeOffset end, Guid? tenantId, int? monitorId, CancellationToken ct = default)
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
            histQuery = histQuery.Where(r => r.UptimeMonitor.TenantId != IApplicationDbContext.SystemTenantGuid);

        var historicalDaily = await histQuery
            .GroupBy(r => r.MonitorId)
            .Select(g => new { 
                MonitorId = g.Key, 
                Avg = (double?)g.Average(r => r.UptimePercentage), 
                Count = g.Count(r => r.UptimePercentage != null) 
            })
            .ToListAsync(ct);

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
                liveQuery = liveQuery.Where(ma => ma.UptimeMonitor!.TenantId != IApplicationDbContext.SystemTenantGuid);

            todayLive = await liveQuery
                .ToDictionaryAsync(ma => ma.MonitorId, ma => ma.UptimePercentage, ct);
        }

        var results = new Dictionary<int, double?>();
        var allMonitorIds = historicalDaily.Select(x => x.MonitorId).Union(todayLive.Keys);

        foreach (var mid in allMonitorIds)
        {
            var hist = historicalDaily.FirstOrDefault(x => x.MonitorId == mid);
            var today = todayLive.TryGetValue(mid, out var todayVal) ? (double?)todayVal : null;
            
            var histCount = hist?.Count ?? 0;
            var todayCount = today.HasValue ? 1 : 0;
            var totalCount = histCount + todayCount;
            
            if (totalCount == 0)
            {
                results[mid] = null;
            }
            else
            {
                var histSum = (hist?.Avg ?? 0) * histCount;
                var todaySum = today ?? 0;
                results[mid] = (histSum + todaySum) / totalCount;
            }
        }

        return results;
    }

    private async Task<List<LatencyRow>> GetMergedLatencyDataAsync(
        IApplicationDbContext db, DateTimeOffset start, DateTimeOffset end, bool isHourly, Guid? tenantId = null, int? monitorId = null, CancellationToken ct = default)
    {
        if (isHourly)
        {
            var query = db.ResponseTimes.AsNoTracking().Where(rt => rt.Date >= start && rt.Date < end);
            if (monitorId.HasValue) 
                query = query.Where(rt => rt.MonitorId == monitorId.Value);
            else if (tenantId.HasValue) 
                query = query.Where(rt => rt.UptimeMonitor!.TenantId == tenantId.Value);
            else 
                query = query.Where(rt => rt.UptimeMonitor!.TenantId != IApplicationDbContext.SystemTenantGuid);

            var grouped = await query
                .GroupBy(rt => new { rt.Date.Year, rt.Date.Month, rt.Date.Day, rt.Date.Hour })
                .Select(g => new LatencyRow(
                    new DateTime(g.Key.Year, g.Key.Month, g.Key.Day, g.Key.Hour, 0, 0),
                    g.Average(rt => rt.Average ?? 0),
                    g.Min(rt => rt.Lowest ?? 0),
                    g.Max(rt => rt.Highest ?? 0)
                ))
                .ToListAsync(ct);
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
            histQuery = histQuery.Where(r => r.UptimeMonitor.TenantId != IApplicationDbContext.SystemTenantGuid);

        var historical = await histQuery
            .Select(r => new LatencyRow(r.Date.DateTime, r.Average ?? 0, r.Lowest ?? 0, r.Highest ?? 0))
            .ToListAsync(ct);

        if (yesterday < end)
        {
            var liveQuery = db.ResponseTimes.AsNoTracking().Where(rt => rt.Date >= yesterday && rt.Date < end);
            if (monitorId.HasValue)
                liveQuery = liveQuery.Where(rt => rt.MonitorId == monitorId.Value);
            else if (tenantId.HasValue)
                liveQuery = liveQuery.Where(rt => rt.UptimeMonitor!.TenantId == tenantId.Value);
            else
                liveQuery = liveQuery.Where(rt => rt.UptimeMonitor!.TenantId != IApplicationDbContext.SystemTenantGuid);

            var fresh = await liveQuery
                .GroupBy(rt => rt.Date.Date)
                .Select(g => new LatencyRow(
                    g.Key,
                    g.Average(rt => rt.Average ?? 0),
                    g.Min(rt => rt.Lowest ?? 0),
                    g.Max(rt => rt.Highest ?? 0)
                ))
                .ToListAsync(ct);
            historical.AddRange(fresh);
        }

        return historical;
    }

    public async Task<UptimeMonitor> CreateMonitorAsync(Guid tenantId, string name, string url, double? uptimeSla, CancellationToken ct = default)
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
        await dbContext.SaveChangesAsync(ct);

        HydrateLiveStatus(monitor);
        return monitor;
    }

    public async Task AssignMonitorAsync(int monitorId, Guid tenantId, CancellationToken ct = default)
    {
        var monitor = await dbContext.Monitors.SingleOrDefaultAsync(m => m.Id == monitorId, ct);
        if (monitor == null) throw new KeyNotFoundException($"Monitor {monitorId} not found.");

        var tenantExists = await dbContext.Tenants.AnyAsync(t => t.Id == tenantId, ct);
        if (!tenantExists) throw new KeyNotFoundException($"Tenant {tenantId} not found.");

        monitor.TenantId = tenantId;
        await dbContext.SaveChangesAsync(ct);
    }

    public async Task ReassignAllTenantMonitorsToSystemAsync(Guid tenantId, CancellationToken ct = default)
    {
        await dbContext.Monitors
            .Where(m => m.TenantId == tenantId)
            .ExecuteUpdateAsync(s => s.SetProperty(m => m.TenantId, IApplicationDbContext.SystemTenantGuid), ct);
    }

    public async Task<IEnumerable<UptimeMonitor>> GetMonitorsByTenantAsync(Guid tenantId, ResolvedPeriod period, CancellationToken ct = default)
    {
        var start = period.CurrentStart;
        var end = period.CurrentEnd;
        
        var monitors = await dbContext.Monitors
            .AsNoTracking()
            .Include(m => m.Tenant)
            .Where(m => m.TenantId == tenantId)
            .ToListAsync(ct);

        var uptimes = await GetPeriodUptimesAsync(start, end, tenantId, null, ct);

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

    public async Task<UptimeMonitor> GetMonitorAsync(Guid tenantId, int id, ResolvedPeriod period, CancellationToken ct = default)
    {
        var start = period.CurrentStart;
        var end = period.CurrentEnd;

        var monitor = await dbContext.Monitors
            .AsNoTracking()
            .Include(m => m.Tenant)
            .SingleOrDefaultAsync(m => m.TenantId == tenantId && m.Id == id, ct);

        if (monitor == null) throw new KeyNotFoundException($"Monitor {id} not found.");

        var uptimes = await GetPeriodUptimesAsync(start, end, null, id, ct);
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
            var mockConfig = configuration["FeatureToggles:MockUptimeRobotIntegrations"];
            var isMockEnabled = bool.TryParse(mockConfig, out var parsed) && parsed;
            if (isMockEnabled && monitor.Id <= 0)
            {
                monitor.StatusStr = "Up";
                monitor.CurrentLatency = 200 + (monitor.Id % 400); // Deterministic fake latency 200-599ms
            }
        }
    }

    private static string FormatStatus(string status) 
    {
        if (string.IsNullOrWhiteSpace(status)) return "Unknown";
        return status.Length > 1 
            ? char.ToUpper(status[0]) + status.Substring(1).ToLower() 
            : status;
    }

    public async Task DeleteMonitorAsync(Guid tenantId, int id, CancellationToken ct = default)
    {
        var monitor = await dbContext.Monitors.SingleOrDefaultAsync(m => m.TenantId == tenantId && m.Id == id, ct);
        if (monitor == null) throw new KeyNotFoundException();

        await uptimeRobotService.DeleteMonitorAsync(id);

        dbContext.Monitors.Remove(monitor);
        await dbContext.SaveChangesAsync(ct);
    }

    public async Task PauseMonitorAsync(int id, CancellationToken ct = default)
    {
        var monitor = await dbContext.Monitors.SingleOrDefaultAsync(m => m.Id == id, ct);
        if (monitor == null) throw new KeyNotFoundException();

        await uptimeRobotService.PauseMonitorAsync(id);
        
        monitor.UptimeMonitorEnabled = false;
        await dbContext.SaveChangesAsync(ct);
    }

    public async Task StartMonitorAsync(int id, CancellationToken ct = default)
    {
        var monitor = await dbContext.Monitors.SingleOrDefaultAsync(m => m.Id == id, ct);
        if (monitor == null) throw new KeyNotFoundException();

        await uptimeRobotService.StartMonitorAsync(id);
        
        monitor.UptimeMonitorEnabled = true;
        await dbContext.SaveChangesAsync(ct);
    }

    public async Task<IEnumerable<ResponseTime>> GetAggregatedLatencyAsync(Guid tenantId, int id, DateTimeOffset from, DateTimeOffset to, CancellationToken ct = default)
    {
        var monitorExists = await dbContext.Monitors
            .AsNoTracking()
            .AnyAsync(m => m.TenantId == tenantId && m.Id == id, ct);

        if (!monitorExists)
        {
            throw new KeyNotFoundException($"Monitor {id} not found.");
        }

        return await dbContext.ResponseTimes
            .AsNoTracking()
            .Where(rt => rt.MonitorId == id)
            .Where(rt => rt.Date >= from && rt.Date <= to)
            .OrderBy(rt => rt.Date)
            .ToListAsync(ct);
    }

    public async Task<UptimeMonitor> UpdateMonitorAsync(int id, string? name, string? url, double? uptimeSla, List<string>? tags, CancellationToken ct = default)
    {
        var monitor = await dbContext.Monitors.SingleOrDefaultAsync(m => m.Id == id, ct);
        if (monitor == null) throw new KeyNotFoundException($"Monitor {id} not found.");

        List<string>? cleanedTags = null;
        if (tags != null)
        {
            cleanedTags = tags
                .Where(t => !string.IsNullOrWhiteSpace(t))
                .Select(t => t.Trim())
                .ToList();
        }

        bool nameChanged = name != null && name != monitor.Name;
        bool urlChanged = url != null && url != monitor.Url;
        bool tagsChanged = cleanedTags != null && !cleanedTags.SequenceEqual(monitor.Tags);

        if (nameChanged || urlChanged || tagsChanged)
        {
            await uptimeRobotService.UpdateMonitorAsync(
                id,
                nameChanged ? name : null,
                urlChanged ? url : null,
                tagsChanged ? cleanedTags : null);

            if (nameChanged)
            {
                monitor.Name = name!;
            }
            if (urlChanged)
            {
                monitor.Url = url!;
            }
            if (tagsChanged && cleanedTags != null)
            {
                monitor.Tags = cleanedTags;
            }
        }

        if (uptimeSla != -1)
        {
            monitor.UptimeSla = uptimeSla;
        }

        await dbContext.SaveChangesAsync(ct);

        HydrateLiveStatus(monitor);
        return monitor;
    }

    private static double CalculateGrowthPercentage(double current, double previous)
    {
        if (previous == 0)
            return 0.0;

        return Math.Round((current - previous) / previous * 100, 2);
    }
}



