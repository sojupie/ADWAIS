using Api.DTOs.GlobalConfig;
using Domain.Entities;
using Infrastructure;
using Infrastructure.Helpers;
using Infrastructure.Jobs;
using Infrastructure.Jobs.Monitor;
using Infrastructure.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Hangfire;

namespace Api.Controllers;

/// <summary>
/// Provides access to system-wide global settings and configurations.
/// </summary>
[ApiController]
[Route("api/global-config")]
public class GlobalConfigController(
    IDbContextFactory<AnalyticsDbContext> dbContextFactory,
    ISystemEventService eventService) : ControllerBase
{
    /// <summary>
    /// Retrieves the current global system configuration.
    /// Sensitive values like API keys are masked.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<GlobalConfigResponseDto>> GetConfig()
    {
        await using var db = await dbContextFactory.CreateDbContextAsync();
        var config = await db.GlobalConfigs.AsNoTracking().SingleOrDefaultAsync();
        if (config == null) return NotFound();

        return Ok(new GlobalConfigResponseDto(
            config.Id,
            config.LastPolled,
            config.LitiumFetchEnabled,
            config.UptimeRobotFetchEnabled,
            config.LitiumFetchIntervalMinutes,
            config.LatencyDegradedFloor,
            MaskApiKey(config.UptimeRobotApiKey),
            config.UptimeFetchIntervalMinutes,
            config.LatencyFetchIntervalMinutes,
            config.UserStatsFetchIntervalMinutes,
            config.SystemEventRetentionDays,
            config.MonitorsCount,
            config.MonitorsLimit,
            config.ActiveSubscription
        ));
    }

    /// <summary>
    /// Partially updates the global system configuration.
    /// Updating fetch intervals will automatically reschedule associated background jobs.
    /// </summary>
    /// <param name="request">The request containing the settings to update.</param>
    [HttpPatch]
    public async Task<ActionResult<GlobalConfigResponseDto>> UpdateConfig([FromBody] UpdateGlobalConfigRequestDto request)
    {
        await using var db = await dbContextFactory.CreateDbContextAsync();
        var config = await db.GlobalConfigs.SingleOrDefaultAsync();
        if (config == null) return NotFound();

        if (request.LitiumFetchEnabled.HasValue) config.LitiumFetchEnabled = request.LitiumFetchEnabled.Value;
        if (request.UptimeRobotFetchEnabled.HasValue) config.UptimeRobotFetchEnabled = request.UptimeRobotFetchEnabled.Value;
        if (request.LatencyDegradedFloor.HasValue) config.LatencyDegradedFloor = request.LatencyDegradedFloor.Value;
        if (request.UptimeRobotApiKey != null) config.UptimeRobotApiKey = request.UptimeRobotApiKey;
        if (request.SystemEventRetentionDays.HasValue) config.SystemEventRetentionDays = request.SystemEventRetentionDays.Value;

        await db.SaveChangesAsync();
        await eventService.LogAsync(nameof(GlobalConfigController), "Global configuration updated.");

        return Ok(new GlobalConfigResponseDto(
            config.Id,
            config.LastPolled,
            config.LitiumFetchEnabled,
            config.UptimeRobotFetchEnabled,
            config.LitiumFetchIntervalMinutes,
            config.LatencyDegradedFloor,
            MaskApiKey(config.UptimeRobotApiKey),
            config.UptimeFetchIntervalMinutes,
            config.LatencyFetchIntervalMinutes,
            config.UserStatsFetchIntervalMinutes,
            config.SystemEventRetentionDays,
            config.MonitorsCount,
            config.MonitorsLimit,
            config.ActiveSubscription
        ));
    }

    private static string? MaskApiKey(string? apiKey)
    {
        if (string.IsNullOrEmpty(apiKey)) return null;
        if (apiKey.Length <= 8) return "****";
        return apiKey[..4] + "****" + apiKey[^4..];
    }
}
