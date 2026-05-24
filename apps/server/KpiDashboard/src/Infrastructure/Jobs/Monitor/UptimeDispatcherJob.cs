using Hangfire;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Jobs.Monitor;

public class UptimeDispatcherJob(IDbContextFactory<AnalyticsDbContext> dbContextFactory, IBackgroundJobClient backgroundJobClient)
{
    public async Task ExecuteAsync()
    {
        await using var dbContext = await dbContextFactory.CreateDbContextAsync();
        
        var monitors = await dbContext.Monitors
            .Where(m => m.UptimeMonitorEnabled)
            .Select(m => new { m.Id, m.LastUptimeUpdate })
            .ToListAsync();

        var now = DateTimeOffset.UtcNow;
        var todayStart = new DateTimeOffset(now.Year, now.Month, now.Day, 0, 0, 0, TimeSpan.Zero);

        foreach (var monitor in monitors)
        {
            // 1. Always sync the full current day to keep "Today" bucket accurate
            backgroundJobClient.Enqueue<UpdateMonitorUptimeJob>(x => x.ExecuteAsync(monitor.Id, todayStart, now));

            // 2. If we missed previous days (e.g. app was down), sync them as full day blocks
            if (monitor.LastUptimeUpdate.HasValue && monitor.LastUptimeUpdate.Value < todayStart)
            {
                var cursor = new DateTimeOffset(monitor.LastUptimeUpdate.Value.Year, monitor.LastUptimeUpdate.Value.Month, monitor.LastUptimeUpdate.Value.Day, 0, 0, 0, TimeSpan.Zero);
                
                while (cursor < todayStart)
                {
                    var dayEnd = cursor.AddDays(1).AddSeconds(-1);
                    backgroundJobClient.Enqueue<UpdateMonitorUptimeJob>(x => x.ExecuteAsync(monitor.Id, cursor, dayEnd));
                    cursor = cursor.AddDays(1);
                }
            }
        }
    }
}
