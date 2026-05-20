using Api.DTOs.Ingestion;
using FluentValidation;
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
    IBackgroundJobClient backgroundJobClient,
    IValidator<HistoricalBackfillRequestDto> validator)
    : ControllerBase
{
    /// <summary>
    /// Manually triggers a historical backfill for a specific tenant within a given date range.
    /// </summary>
    /// <remarks>
    /// If StartDate or EndDate are omitted, the system defaults to a 2-year lookback ending now.
    /// This job is offloaded to Hangfire for background processing.
    /// </remarks>
    /// <param name="request">The backfill request parameters.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>The ID of the enqueued background job.</returns>
    [HttpPost("backfill")]
    public async Task<IActionResult> ExecuteHistoricalBackfill(
        [FromBody] HistoricalBackfillRequestDto request,
        CancellationToken ct)
    {
        var validationResult = await validator.ValidateAsync(request, ct);
        if (!validationResult.IsValid) return BadRequest(validationResult.Errors);

        await using var context = await contextFactory.CreateDbContextAsync(ct);
        var tenant = await context.Tenants.SingleOrDefaultAsync(t => t.Id == request.TenantId, ct);
        
        if (tenant == null) return NotFound("Tenant not found.");
        if (tenant.CurrentlyFetching) return Conflict(new { message = $"Tenant {request.TenantId} is currently fetching. Wait for the active job to complete." });

        tenant.CurrentlyFetching = true;
        await context.SaveChangesAsync(ct);

        var jobId = backgroundJobClient.Enqueue<ILitiumIngestionService>(
            service => service.ExecuteIngestionAsync(tenant.Id, request.StartDate, request.EndDate, CancellationToken.None));

        return Accepted(new { JobId = jobId });
    }
}