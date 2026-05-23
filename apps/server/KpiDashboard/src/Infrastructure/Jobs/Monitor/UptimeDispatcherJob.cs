using Hangfire;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Jobs.Monitor;

public class UptimeDispatcherJob(IDbContextFactory<AnalyticsDbContext> dbContextFactory, IBackgroundJobClient backgroundJobClient)
{
    public async Task ExecuteAsync()
    {
        await using var dbContext = await dbContextFactory.CreateDbContextAsync();
        var globalConfig = await dbContext.GlobalConfigs.SingleOrDefaultAsync();
        var globalInterval = globalConfig?.UptimeFetchIntervalMinutes ?? 60;
        
        var monitors = await dbContext.Monitors
            .Where(m => m.UptimeMonitorEnabled)
            .Select(m => new { m.Id, m.LastUptimeUpdate })
            .ToListAsync();

        var end = DateTimeOffset.UtcNow;

        foreach (var monitor in monitors)
        {
            var start = monitor.LastUptimeUpdate ?? end.AddMinutes(-globalInterval);

            backgroundJobClient.Enqueue<UpdateMonitorUptimeJob>(x => x.ExecuteAsync(monitor.Id, start, end));
        }
    }
}
