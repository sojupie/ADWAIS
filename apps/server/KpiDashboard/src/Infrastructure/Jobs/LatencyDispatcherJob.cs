using Hangfire;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Jobs;

public class LatencyDispatcherJob(IDbContextFactory<AnalyticsDbContext> dbContextFactory, IBackgroundJobClient backgroundJobClient)
{
    public async Task ExecuteAsync()
    {
        await using var dbContext = await dbContextFactory.CreateDbContextAsync();
        var globalConfig = await dbContext.GlobalConfigs.SingleOrDefaultAsync();
        var globalInterval = globalConfig?.LatencyFetchIntervalMinutes ?? 10;
        
        var monitors = await dbContext.Monitors
            .Where(m => m.UptimeMonitorEnabled)
            .Select(m => new { m.Id, m.LastLatencyUpdate })
            .ToListAsync();

        var end = DateTimeOffset.UtcNow;

        foreach (var monitor in monitors)
        {
            var start = monitor.LastLatencyUpdate ?? end.AddMinutes(-globalInterval);

            backgroundJobClient.Enqueue<UpdateMonitorLatencyJob>(x => x.ExecuteAsync(monitor.Id, start, end));
        }
    }
}
