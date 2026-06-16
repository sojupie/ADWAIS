using Adwais.Infrastructure.Persistence;
using Adwais.Domain.Entities.Monitoring;
using Adwais.Application.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace Adwais.Infrastructure.Jobs.Monitor;

public class UpdateMonitorUptimeJob(
    IDbContextFactory<AnalyticsDbContext> dbContextFactory,
    IUptimeRobotService uptimeRobotService,
    ISystemEventService eventService,
    IConfiguration configuration)
{
    public async Task ExecuteAsync(int monitorId, DateTimeOffset startDate, DateTimeOffset endDate)
    {
        var currentStep = "Initializing Database Connection";
        try
        {
            await using var dbContext = await dbContextFactory.CreateDbContextAsync();
            
            currentStep = $"Fetching Monitor metadata for MonitorId {monitorId}";
            var monitor = await dbContext.Monitors.FirstOrDefaultAsync(m => m.Id == monitorId);

            if (monitor == null || !monitor.UptimeMonitorEnabled) return;

            var isMockEnabled = configuration.GetValue<bool>("FeatureToggles:MockUptimeRobotIntegrations", false);
            if (isMockEnabled && monitorId <= 0) return;
            currentStep = "Fetching uptime status from UptimeRobot API";
            var uptime = await uptimeRobotService.GetUptimeAsync(monitorId, startDate, endDate, monitor.Name);

            currentStep = "Updating Monitor uptime percentage and timestamps";
            monitor.CurrentUptimePercentage = uptime;
            monitor.LastUptimeUpdate = endDate;
            monitor.LastSyncError = null;

            currentStep = "Configuring Daily Monitor Availability records";
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
        
            currentStep = "Saving uptime and availability to database";
            await dbContext.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            var detailedErrorMessage = $"Failed during step '{currentStep}': {ex.Message}";
            try
            {
                await eventService.LogErrorAsync(nameof(UpdateMonitorUptimeJob), detailedErrorMessage, ex, tenantId: null);
            }
            catch
            {
                // Suppress logging service failure
            }

            try
            {
                await using var errorContext = await dbContextFactory.CreateDbContextAsync(CancellationToken.None);
                var monitor = await errorContext.Monitors.FirstOrDefaultAsync(m => m.Id == monitorId);
                if (monitor != null)
                {
                    monitor.LastSyncError = detailedErrorMessage;
                    await errorContext.SaveChangesAsync(CancellationToken.None);
                }
            }
            catch
            {
                // Suppress nested DB update failure
            }
            throw;
        }
    }
}
