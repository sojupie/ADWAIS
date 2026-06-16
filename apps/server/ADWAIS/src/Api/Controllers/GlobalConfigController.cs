using Adwais.Api.DTOs.GlobalConfig;
using Adwais.Domain.Entities;
using Adwais.Infrastructure.Persistence;
using Adwais.Infrastructure.Helpers;
using Adwais.Infrastructure.Jobs;
using Adwais.Infrastructure.Jobs.Monitor;
using Adwais.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Hangfire;

namespace Adwais.Api.Controllers;

/// <summary>
/// Provides access to system-wide global settings and configurations.
/// </summary>
[ApiController]
[Route("api/global-config")]
[Authorize(Policy = "AdminOnly")]
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
        if (config == null) return NotFound(new { error = "Global config may not be set" });

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
            config.ActiveSubscription,
            config.DefaultUptimeSla
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
        if (config == null) return NotFound(new { error = "Global config may not be set" });

        if (request.LitiumFetchEnabled.HasValue) config.LitiumFetchEnabled = request.LitiumFetchEnabled.Value;
        if (request.UptimeRobotFetchEnabled.HasValue) config.UptimeRobotFetchEnabled = request.UptimeRobotFetchEnabled.Value;
        if (request.LatencyDegradedFloor != -1) config.LatencyDegradedFloor = request.LatencyDegradedFloor;
        if (request.UptimeRobotApiKey != null) config.UptimeRobotApiKey = string.IsNullOrWhiteSpace(request.UptimeRobotApiKey) ? null : request.UptimeRobotApiKey;
        if (request.SystemEventRetentionDays.HasValue) config.SystemEventRetentionDays = request.SystemEventRetentionDays.Value;
        if (request.DefaultUptimeSla != -1) config.DefaultUptimeSla = request.DefaultUptimeSla;

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
            config.ActiveSubscription,
            config.DefaultUptimeSla
        ));
    }

    private static string? MaskApiKey(string? apiKey)
    {
        if (string.IsNullOrEmpty(apiKey)) return null;
        if (apiKey.Length <= 8) return "****";
        return apiKey[..4] + "****" + apiKey[^4..];
    }
}



