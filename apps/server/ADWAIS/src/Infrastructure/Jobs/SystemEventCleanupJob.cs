// Part of the ADWAIS project, under the Business Source License 1.1.
// See /LICENSE for license information.
// SPDX-License-Identifier: BUSL-1.1

using Adwais.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Adwais.Infrastructure.Jobs;

public class SystemEventCleanupJob(
    IDbContextFactory<AnalyticsDbContext> dbContextFactory,
    ILogger<SystemEventCleanupJob> logger)
{
    public async Task ExecuteAsync()
    {
        await using var db = await dbContextFactory.CreateDbContextAsync();
        var config = await db.GlobalConfigs.AsNoTracking().SingleOrDefaultAsync();
        
        var retentionDays = config?.SystemEventRetentionDays ?? 30;
        var cutoff = DateTimeOffset.UtcNow.AddDays(-retentionDays);

        logger.LogInformation("Starting SystemEvent cleanup. Removing events older than {RetentionDays} days (Cutoff: {Cutoff})", 
            retentionDays, cutoff);

        try
        {
            var deletedCount = await db.SystemEvents
                .Where(e => e.Timestamp < cutoff)
                .ExecuteDeleteAsync();

            logger.LogInformation("Successfully deleted {Count} old system events.", deletedCount);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to perform SystemEvent cleanup.");
        }
    }
}


