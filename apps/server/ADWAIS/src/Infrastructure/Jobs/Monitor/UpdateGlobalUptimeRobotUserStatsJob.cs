using Adwais.Infrastructure.Persistence;
using Adwais.Application.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Adwais.Infrastructure.Jobs.Monitor;

public class UpdateGlobalUptimeRobotUserStatsJob(
    IDbContextFactory<AnalyticsDbContext> dbContextFactory,
    IUptimeRobotService uptimeRobotService,
    ILogger<UpdateGlobalUptimeRobotUserStatsJob> logger,
    ISystemEventService eventService)
{
    public async Task ExecuteAsync()
    {
        await using var db = await dbContextFactory.CreateDbContextAsync();
        var config = await db.GlobalConfigs.FirstOrDefaultAsync();

        if (config == null || string.IsNullOrWhiteSpace(config.UptimeRobotApiKey) || !config.UptimeRobotFetchEnabled)
        {
            return;
        }

        try
        {
            var user = await uptimeRobotService.GetAccountDetailsAsync();
            config.MonitorsCount = user.MonitorsCount;
            config.MonitorsLimit = user.MonitorLimit;
            config.ActiveSubscription = user.ActiveSubscriptionPlan;
            config.LastSyncError = null;
            
            await db.SaveChangesAsync();
            logger.LogInformation("Updated UptimeRobot global user stats: {Count}/{Limit} ({Sub})", user.MonitorsCount, user.MonitorLimit, user.ActiveSubscriptionPlan);
        }
        catch (Exception ex)
        {
            var detailedErrorMessage = $"Failed to update UptimeRobot global user stats: {ex.Message}";
            try
            {
                await eventService.LogErrorAsync(nameof(UpdateGlobalUptimeRobotUserStatsJob), detailedErrorMessage, ex);
            }
            catch
            {
                // Suppress logging service failure
            }

            try
            {
                config.LastSyncError = detailedErrorMessage;
                await db.SaveChangesAsync();
            }
            catch
            {
                // Suppress nested DB update failure
            }
            throw;
        }
    }
}



