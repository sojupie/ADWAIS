using Domain.Entities;
using Infrastructure;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SystemEventController(IDbContextFactory<AnalyticsDbContext> dbContextFactory) : ControllerBase
{
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