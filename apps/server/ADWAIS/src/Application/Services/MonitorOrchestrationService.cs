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
    private record LatencyRow(DateTimeOffset Timestamp, double? Average, double? P10, double? P90);

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
                    P10 = g.Average(r => r.P10), 
                    P90 = g.Average(r => r.P90) 
                });

        var previousByStep = previousRows
            .GroupBy(r => (int)((r.Timestamp - previousStart.UtcDateTime).TotalHours / binSizeHours))
            .ToDictionary(g => g.Key, g => (double?)g.Average(r => r.Average));

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
            double? prevAvg = previousByStep.TryGetValue(i, out var p) ? p : null;

            latencyPoints.Add(new LatencyPointDto(
                timestamp, 
                data?.Avg, 
                prevAvg,
                data?.P10, 
                data?.P90));
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

        double? avgUptime = currentEnabledUptimes.Count > 0 ? currentEnabledUptimes.Average() : null;
        double? previousAvgUptime = previousEnabledUptimes.Count > 0 ? previousEnabledUptimes.Average() : null;
        double? uptimeGrowth = CalculateGrowthPercentage(avgUptime, previousAvgUptime);

        double? avgLatency = currentRows.Count > 0 ? currentRows.Average(r => r.Average) : null;
        double? prevAvgLatency = previousRows.Count > 0 ? previousRows.Average(r => r.Average) : null;
        double? latencyGrowth = CalculateGrowthPercentage(avgLatency, prevAvgLatency);

        double? highestLatency = currentRows.Count > 0 ? currentRows.Max(r => r.P90) : null;
        double? prevHighestLatency = previousRows.Count > 0 ? previousRows.Max(r => r.P90) : null;
        double? highestLatencyGrowth = CalculateGrowthPercentage(highestLatency, prevHighestLatency);

        double? lowestLatency = currentRows.Count > 0 ? currentRows.Min(r => r.P10) : null;
        double? prevLowestLatency = previousRows.Count > 0 ? previousRows.Min(r => r.P10) : null;
        double? lowestLatencyGrowth = CalculateGrowthPercentage(lowestLatency, prevLowestLatency);

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
        // Floor start boundary to UTC midnight to capture preceding time-series buckets
        var queryStart = new DateTimeOffset(start.UtcDateTime.Date, TimeSpan.Zero);
        var yesterday = new DateTimeOffset(DateTimeOffset.UtcNow.Date, TimeSpan.Zero);
        
        var histEnd = yesterday < end ? yesterday : end;

        var histQuery = dbContext.DailyAvailabilityMonitorRollups
            .AsNoTracking()
            .Where(r => r.Date >= queryStart && r.Date < histEnd);

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
            .ToDictionaryAsync(x => x.MonitorId, x => (x.Avg, x.Count), ct);

        var todayLive = new Dictionary<int, (double? Avg, int Count)>();
        if (yesterday < end)
        {
            var liveStart = yesterday > queryStart ? yesterday : queryStart;
            IQueryable<MonitorAvailability> liveQuery = dbContext.MonitorAvailabilities
                .AsNoTracking()
                .Where(ma => ma.Date >= liveStart && ma.Date < end);

            if (monitorId.HasValue)
                liveQuery = liveQuery.Where(ma => ma.MonitorId == monitorId.Value);
            else if (tenantId.HasValue)
                liveQuery = liveQuery.Where(ma => ma.UptimeMonitor!.TenantId == tenantId.Value);
            else
                liveQuery = liveQuery.Where(ma => ma.UptimeMonitor!.TenantId != IApplicationDbContext.SystemTenantGuid);

            todayLive = await liveQuery
                .GroupBy(ma => ma.MonitorId)
                .Select(g => new { 
                    MonitorId = g.Key, 
                    Avg = (double?)g.Average(ma => ma.UptimePercentage),
                    Count = g.Count(ma => ma.UptimePercentage != null) 
                })
                .ToDictionaryAsync(x => x.MonitorId, x => (x.Avg, x.Count), ct);
        }

        var results = new Dictionary<int, double?>();
        var allMonitorIds = historicalDaily.Keys.Union(todayLive.Keys).Distinct();

        foreach (var mid in allMonitorIds)
        {
            var hasHist = historicalDaily.TryGetValue(mid, out var hist);
            var hasLive = todayLive.TryGetValue(mid, out var live);
            
            var histCount = hasHist ? hist.Count : 0;
            var liveCount = hasLive ? live.Count : 0;
            var totalCount = histCount + liveCount;
            
            if (totalCount == 0)
            {
                results[mid] = null;
            }
            else
            {
                var histSum = (hasHist ? (hist.Avg ?? 0) : 0) * histCount;
                var liveSum = (hasLive ? (live.Avg ?? 0) : 0) * liveCount;
                results[mid] = (histSum + liveSum) / totalCount;
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

            var raw = await query
                .Select(rt => new { rt.Date, rt.Average })
                .ToListAsync(ct);

            var grouped = raw
                .GroupBy(rt => new DateTimeOffset(rt.Date.Year, rt.Date.Month, rt.Date.Day, rt.Date.Hour, 0, 0, TimeSpan.Zero))
                .Select(g => {
                    var avgList = g.Where(x => x.Average.HasValue).Select(x => x.Average!.Value).ToList();
                    return new LatencyRow(
                        g.Key,
                        avgList.Count > 0 ? avgList.Average() : null,
                        CalculatePercentile(avgList, 0.10),
                        CalculatePercentile(avgList, 0.90)
                    );
                })
                .OrderBy(r => r.Timestamp)
                .ToList();
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
            .Select(r => new LatencyRow(r.Date, r.Average, r.P10, r.P90))
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

            var liveRaw = await liveQuery
                .Select(rt => new { rt.Date, rt.Average })
                .ToListAsync(ct);

            var fresh = liveRaw
                .GroupBy(rt => new DateTimeOffset(rt.Date.Year, rt.Date.Month, rt.Date.Day, 0, 0, 0, TimeSpan.Zero))
                .Select(g => {
                    var avgList = g.Where(x => x.Average.HasValue).Select(x => x.Average!.Value).ToList();
                    return new LatencyRow(
                        g.Key,
                        avgList.Count > 0 ? avgList.Average() : null,
                        CalculatePercentile(avgList, 0.10),
                        CalculatePercentile(avgList, 0.90)
                    );
                })
                .ToList();
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
        var monitors = await dbContext.Monitors
            .Where(m => m.TenantId == tenantId)
            .ToListAsync(ct);

        foreach (var m in monitors)
        {
            m.TenantId = IApplicationDbContext.SystemTenantGuid;
        }
        await dbContext.SaveChangesAsync(ct);
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
                monitor.CurrentLatency = 200 + (monitor.Id % 400); 
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

        if (uptimeSla.HasValue)
        {
            monitor.UptimeSla = uptimeSla;
        }

        await dbContext.SaveChangesAsync(ct);

        HydrateLiveStatus(monitor);
        return monitor;
    }

    private static double? CalculateGrowthPercentage(double? current, double? previous)
    {
        if (!current.HasValue || !previous.HasValue || previous == 0)
            return null;

        return Math.Round((current.Value - previous.Value) / previous.Value * 100, 2);
    }

    private static double? CalculatePercentile(List<double> values, double percentile)
    {
        if (values == null || values.Count == 0) return null;
        values.Sort();
        var idx = (int)Math.Round(percentile * (values.Count - 1));
        return values[idx];
    }
}
