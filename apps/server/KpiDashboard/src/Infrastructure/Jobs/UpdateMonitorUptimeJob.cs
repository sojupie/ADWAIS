using Domain.Entities.Monitoring;
using Infrastructure.Services.Monitoring;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Jobs;

public class UpdateMonitorUptimeJob(
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

        var uptime = await uptimeRobotService.GetUptimeAsync(monitorId, startDate, endDate);

        monitor.CurrentUptimePercentage = uptime;
        monitor.LastUptimeUpdate = endDate;
        
        await dbContext.SaveChangesAsync();
    }
}
