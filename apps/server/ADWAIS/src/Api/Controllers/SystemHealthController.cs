using Adwais.Application.DTOs.System;
using Adwais.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Adwais.Api.Controllers;

/// <summary>
/// Provides a high-level overview of system health and background job status.
/// </summary>
[ApiController]
[Route("api/system/health")]
public class SystemHealthController(ISystemHealthService healthService) : ControllerBase
{
    /// <summary>
    /// Retrieves an aggregated health report of the entire application pipeline.
    /// </summary>
    [HttpGet]
    [Authorize(Policy = "KioskOrStaffAccess")]
    public async Task<ActionResult<SystemHealthDto>> GetHealth()
    {
        var health = await healthService.GetHealthAsync();
        return Ok(health);
    }

    /// <summary>
    /// Clears all stored sync errors from tenants, monitors, and global configuration.
    /// </summary>
    [HttpPost("clear-errors")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> ClearErrors()
    {
        await healthService.ClearErrorsAsync();
        return NoContent();
    }

    /// <summary>
    /// Retrieves a list of recent background job executions and their status.
    /// </summary>
    [HttpGet("jobs")]
    [Authorize(Policy = "KioskOrStaffAccess")]
    public async Task<ActionResult<IEnumerable<BackgroundJobStatusDto>>> GetRecentJobs()
    {
        var jobs = await healthService.GetRecentJobsAsync();
        return Ok(jobs);
    }
}
