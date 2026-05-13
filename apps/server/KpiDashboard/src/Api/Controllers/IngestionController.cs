using Hangfire;
using Infrastructure;
using Infrastructure.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class IngestionController(
    IDbContextFactory<AnalyticsDbContext> contextFactory,
    IBackgroundJobClient backgroundJobClient)
    : ControllerBase
{
    [HttpPost("backfill")]
    public async Task<IActionResult> ExecuteHistoricalBackfill(
        [FromQuery] Guid tenantId, 
        [FromQuery] DateTimeOffset startDate, 
        [FromQuery] DateTimeOffset endDate,
        CancellationToken ct)
    {
        if (startDate >= endDate) return BadRequest("startDate must be before endDate");

        await using var context = await contextFactory.CreateDbContextAsync(ct);
        var tenant = await context.Tenants.FirstOrDefaultAsync(t => t.Id == tenantId, ct);
        
        if (tenant == null) return NotFound("Tenant not found.");

        var jobId = backgroundJobClient.Enqueue<ITenantIngestionService>(
            service => service.ExecuteIngestionAsync(tenant, startDate, endDate, CancellationToken.None));

        return Accepted(new { JobId = jobId });
    }
}