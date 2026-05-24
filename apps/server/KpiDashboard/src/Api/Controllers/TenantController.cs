using Api.DTOs.Tenants;
using Api.DTOs.Monitoring;
using Domain.Entities;
using FluentValidation;
using Infrastructure;
using Infrastructure.Services.Monitoring;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Api.Controllers;

/// <summary>
/// Manages tenant lifecycle and configuration.
/// </summary>
[ApiController]
[Route("api/tenants")]
public class TenantController(
    IDbContextFactory<AnalyticsDbContext> contextFactory,
    IMonitorOrchestrationService monitorService) : ControllerBase
{
    /// <summary>
    /// Retrieves tenants, optionally filtered by ID.
    /// If an ID is provided, monitor status is hydrated.
    /// </summary>
    /// <param name="id">Optional tenant ID to retrieve a single tenant.</param>
    /// <returns>A list of tenants or a single tenant if ID is provided.</returns>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<TenantResponseDto>>> GetTenants([FromQuery] Guid? id)
    {
        await using var context = await contextFactory.CreateDbContextAsync();

        if (id.HasValue)
        {
            var tenant = await context.Tenants
                .AsNoTracking()
                .Where(t => t.Id == id.Value)
                .Select(t => new TenantResponseDto()
                {
                    Id = t.Id,
                    Name = t.Name,
                    LitiumBaseUrl = t.LitiumBaseUrl,
                    CurrentlyFetching = t.CurrentlyFetching,
                    FetchedFrom = t.FetchedFrom,
                    FetchedUntil = t.FetchedUntil,
                    LastPolled = t.LastPolled,
                    OrderFetchingEnabled = t.OrderFetchingEnabled,
                    MonitorCount = t.Monitors.Count
                })
                .SingleOrDefaultAsync();

            return Ok(tenant);
        }

        var tenants = await context.Tenants
            .AsNoTracking()
            .Select(t => new TenantResponseDto()
            {
                Id = t.Id,
                Name = t.Name,
                LitiumBaseUrl = t.LitiumBaseUrl,
                CurrentlyFetching = t.CurrentlyFetching,
                FetchedFrom = t.FetchedFrom,
                FetchedUntil = t.FetchedUntil,
                LastPolled = t.LastPolled,
                OrderFetchingEnabled = t.OrderFetchingEnabled,
                MonitorCount = t.Monitors.Count
            })
            .ToListAsync();

        return Ok(tenants);
    }

    /// <summary>
    /// Creates a new tenant.
    /// </summary>
    /// <param name="request">The tenant configuration details.</param>
    /// <returns>The newly created tenant.</returns>
    /// <response code="400">If the request is invalid (handled by ValidationFilter).</response>
    [HttpPost]
    public async Task<IActionResult> CreateTenant([FromBody] CreateTenantRequestDto request)
    {
        await using var context = await contextFactory.CreateDbContextAsync();

        var tenant = new Tenant
        {
            Name = request.Name,
            LitiumBaseUrl = request.LitiumBaseUrl,
            ServiceAccountToken = request.ServiceAccountToken,
            OrderFetchingEnabled = request.OrderFetchingEnabled
        };

        context.Tenants.Add(tenant);
        await context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetTenants), new { id = tenant.Id }, new TenantResponseDto()
            {
                Id = tenant.Id,
                Name = tenant.Name,
                LitiumBaseUrl = tenant.LitiumBaseUrl,
                CurrentlyFetching = tenant.CurrentlyFetching,
                FetchedFrom = tenant.FetchedFrom,
                FetchedUntil = tenant.FetchedUntil,
                LastPolled = tenant.LastPolled,
                OrderFetchingEnabled = tenant.OrderFetchingEnabled
            });
    }

    /// <summary>
    /// Deletes a tenant and reassigns its monitors to the system tenant.
    /// </summary>
    /// <param name="id">The ID of the tenant to delete.</param>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteTenant(Guid id)
    {
        if (id == AnalyticsDbContext.SystemTenantGuid)
        {
            return BadRequest("Cannot delete the system tenant.");
        }

        await using var context = await contextFactory.CreateDbContextAsync();
        var tenant = await context.Tenants.FindAsync(id);
        if (tenant == null)
        {
            return NotFound();
        }
        
        await monitorService.ReassignAllTenantMonitorsToSystemAsync(id);

        context.Tenants.Remove(tenant);
        await context.SaveChangesAsync();
        return NoContent();
    }
    
    /// <summary>
    /// Partially updates a tenant's configuration.
    /// </summary>
    /// <param name="id">The ID of the tenant to update.</param>
    /// <param name="request">The fields to update.</param>
    [HttpPatch("{id:guid}")]
    public async Task<IActionResult> UpdateTenant(Guid id, [FromBody] UpdateTenantRequestDto request)
    {
        await using var context = await contextFactory.CreateDbContextAsync();

        var tenant = await context.Tenants.FindAsync(id);
        if (tenant == null)
        {
            return NotFound();
        }
        if (request.Name is not null)
        {
            tenant.Name = request.Name.Trim();
        }
        if (request.LitiumBaseUrl is not null)
        {
            tenant.LitiumBaseUrl = request.LitiumBaseUrl.Trim();
        }
        if (request.ServiceAccountToken is not null)
        {
            tenant.ServiceAccountToken = request.ServiceAccountToken;
        }
        if (request.OrderFetchingEnabled.HasValue)
        {
            tenant.OrderFetchingEnabled = request.OrderFetchingEnabled.Value;
        }

        await context.SaveChangesAsync();

        return Ok(new TenantResponseDto()
        {
            Id = tenant.Id,
            Name = tenant.Name,
            LitiumBaseUrl = tenant.LitiumBaseUrl,
            CurrentlyFetching = tenant.CurrentlyFetching,
            FetchedFrom = tenant.FetchedFrom,
            FetchedUntil = tenant.FetchedUntil,
            LastPolled = tenant.LastPolled,
            OrderFetchingEnabled = tenant.OrderFetchingEnabled
        });
    }

    private static UptimeMonitorDto ToDto(Domain.Entities.Monitoring.UptimeMonitor m)
    {
        return new UptimeMonitorDto(
            Id: m.Id,
            TenantId: m.TenantId,
            Name: m.Name,
            Url: m.Url,
            UpdateInterval: m.UpdateInterval,
            UptimeSla: m.UptimeSla,
            UptimeMonitorEnabled: m.UptimeMonitorEnabled,
            CurrentStatus: m.StatusStr, // Hydrated by service
            LastUpdate: m.LastUpdate,
            LastUptimeUpdate: m.LastUptimeUpdate,
            LastLatencyUpdate: m.LastLatencyUpdate,
            CreatedDate: m.CreatedDate);
    }
}
