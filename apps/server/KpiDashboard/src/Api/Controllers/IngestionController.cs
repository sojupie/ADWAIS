using Infrastructure;
using Infrastructure.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class IngestionController(
    IDbContextFactory<AnalyticsDbContext> contextFactory,
    ITenantIngestionService ingestionService)
    : ControllerBase
{
    [HttpPost("backfill")]
    public async Task<IActionResult> ExecuteHistoricalBackfill([FromQuery] Guid tenantId, [FromQuery] DateTimeOffset startDate, [FromQuery] DateTimeOffset endDate)
    {
        if (startDate >= endDate) return BadRequest("startDate must be before endDate");

        using var context = await contextFactory.CreateDbContextAsync();
        var tenant = await context.Tenants.FindAsync(tenantId);
        
        if (tenant == null) return NotFound("Tenant not found.");

        try
        {
            var totalIngested = await ingestionService.ExecuteIngestionAsync(tenant, startDate, endDate);
            return Ok(new { IngestedCount = totalIngested });
        }
        catch (Exception ex)
        {
            return StatusCode(500, ex.Message);
        }
    }
}