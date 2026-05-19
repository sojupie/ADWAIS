using Domain.Entities.Monitoring;
using Infrastructure.Services.Monitoring;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Jobs;

public class UpdateMonitorLatencyJob(
    IDbContextFactory<AnalyticsDbContext> dbContextFactory,
    IUptimeRobotService uptimeRobotService)
{
    public async Task ExecuteAsync(int monitorId, DateTimeOffset startDate, DateTimeOffset endDate)
    {
        await using var dbContext = await dbContextFactory.CreateDbContextAsync();
        var monitor = await dbContext.Monitors.FirstOrDefaultAsync(m => m.Id == monitorId);

        if (monitor == null || !monitor.UptimeMonitorEnabled)
        {
            return; // Deleted or paused
        }

        var responseTime = await uptimeRobotService.GetResponseTimeAsync(monitorId, startDate, endDate);

        if (responseTime.Average.HasValue)
        {
            dbContext.ResponseTimes.Add(new ResponseTime
            {
                MonitorId = monitorId,
                Average = responseTime.Average.Value,
                Lowest = responseTime.Lowest,
                Highest = responseTime.Highest,
                Date = endDate
            });
        }

        monitor.LastLatencyUpdate = endDate;
        await dbContext.SaveChangesAsync();
    }
}
