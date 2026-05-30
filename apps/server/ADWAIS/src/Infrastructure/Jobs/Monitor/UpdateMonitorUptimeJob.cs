using Adwais.Domain.Entities.Monitoring;
using Adwais.Infrastructure.Services.Monitoring;
using Microsoft.EntityFrameworkCore;

namespace Adwais.Infrastructure.Jobs.Monitor;

public class UpdateMonitorUptimeJob(
    IDbContextFactory<AnalyticsDbContext> dbContextFactory,
    IUptimeRobotService uptimeRobotService)
{
    public async Task ExecuteAsync(int monitorId, DateTimeOffset startDate, DateTimeOffset endDate)
    {
        await using var dbContext = await dbContextFactory.CreateDbContextAsync();
        var monitor = await dbContext.Monitors.FirstOrDefaultAsync(m => m.Id == monitorId);

        if (monitor == null || !monitor.UptimeMonitorEnabled) return;

        try
        {
            var uptime = await uptimeRobotService.GetUptimeAsync(monitorId, startDate, endDate);

            monitor.CurrentUptimePercentage = uptime;
            monitor.LastUptimeUpdate = endDate;
            monitor.LastSyncError = null;

            var date = new DateTimeOffset(startDate.Year, startDate.Month, startDate.Day, 0, 0, 0, TimeSpan.Zero);
            var availability = await dbContext.MonitorAvailabilities
                .FirstOrDefaultAsync(ma => ma.MonitorId == monitorId && ma.Date == date);

            if (availability == null)
            {
                availability = new MonitorAvailability
                {
                    MonitorId = monitorId,
                    Date = date,
                    UptimePercentage = uptime
                };
                dbContext.MonitorAvailabilities.Add(availability);
            }
            else
            {
                availability.UptimePercentage = uptime;
            }
        
            await dbContext.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            monitor.LastSyncError = ex.Message;
            await dbContext.SaveChangesAsync();
            throw;
        }
    }
}


