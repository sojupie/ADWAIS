using Adwais.Domain.Entities;
using Adwais.Infrastructure;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Adwais.Api.Controllers;

/// <summary>
/// Provides access to system-wide audit events and logs.
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class SystemEventController(IDbContextFactory<AnalyticsDbContext> dbContextFactory) : ControllerBase
{
    /// <summary>
    /// Retrieves a list of recent system events, with optional filtering.
    /// </summary>
    /// <param name="take">Number of events to retrieve (default 50).</param>
    /// <param name="minLevel">Minimum event level to include (e.g., Information, Warning, Error).</param>
    /// <param name="tenantId">Filter events related to a specific tenant.</param>
    /// <returns>A list of system events.</returns>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<SystemEvent>>> GetEvents(
        [FromQuery] int take = 50, 
        [FromQuery] SystemEventLevel? minLevel = null,
        [FromQuery] Guid? tenantId = null)
    {
        await using var db = await dbContextFactory.CreateDbContextAsync();
        
        var query = db.SystemEvents
            .AsNoTracking()
            .Include(e => e.Tenant)
            .OrderByDescending(e => e.Timestamp)
            .AsQueryable();

        if (minLevel.HasValue)
        {
            query = query.Where(e => e.Level >= minLevel.Value);
        }

        if (tenantId.HasValue)
        {
            query = query.Where(e => e.TenantId == tenantId.Value);
        }

        var events = await query.Take(take).ToListAsync();
        return Ok(events);
    }

    /// <summary>
    /// Deletes system events older than a specified number of days.
    /// </summary>
    /// <param name="olderThanDays">Delete events older than this many days (default 30).</param>
    /// <returns>The number of deleted events.</returns>
    [HttpDelete("clear")]
    public async Task<IActionResult> ClearEvents([FromQuery] int olderThanDays = 30)
    {
        await using var db = await dbContextFactory.CreateDbContextAsync();
        var cutoff = DateTimeOffset.UtcNow.AddDays(-olderThanDays);
        
        var count = await db.SystemEvents
            .Where(e => e.Timestamp < cutoff)
            .ExecuteDeleteAsync();

        return Ok(new { DeletedCount = count });
    }
}


