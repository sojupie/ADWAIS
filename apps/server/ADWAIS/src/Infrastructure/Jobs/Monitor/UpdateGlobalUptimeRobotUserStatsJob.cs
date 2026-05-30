using Adwais.Infrastructure.Persistence;
using Adwais.Application.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Adwais.Infrastructure.Jobs.Monitor;

public class UpdateGlobalUptimeRobotUserStatsJob(
    IDbContextFactory<AnalyticsDbContext> dbContextFactory,
    IUptimeRobotService uptimeRobotService,
    ILogger<UpdateGlobalUptimeRobotUserStatsJob> logger)
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
            config.LastSyncError = ex.Message;
            await db.SaveChangesAsync();
            logger.LogError(ex, "Failed to update UptimeRobot global user stats.");
            throw;
        }
    }
}



