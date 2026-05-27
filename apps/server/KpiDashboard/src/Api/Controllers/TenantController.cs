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
    /// </summary>
    /// <param name="id">Optional tenant ID to retrieve a single tenant.</param>
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
                    Type = t.Type,
                    LitiumBaseUrl = t.LitiumBaseUrl,
                    CurrentlyFetching = t.CurrentlyFetching,
                    FetchedFrom = t.FetchedFrom,
                    FetchedUntil = t.FetchedUntil,
                    LastPolled = t.LastPolled,
                    OrderFetchingEnabled = t.OrderFetchingEnabled,
                    MonitorCount = t.Monitors.Count,
                    LastSyncError = t.LastSyncError
                })
                .SingleOrDefaultAsync();

            if (tenant == null) return Ok(Enumerable.Empty<TenantResponseDto>());

            return Ok(new[] { tenant });
        }

        var tenants = await context.Tenants
            .AsNoTracking()
            .Select(t => new TenantResponseDto()
            {
                Id = t.Id,
                Name = t.Name,
                Type = t.Type,
                LitiumBaseUrl = t.LitiumBaseUrl,
                CurrentlyFetching = t.CurrentlyFetching,
                FetchedFrom = t.FetchedFrom,
                FetchedUntil = t.FetchedUntil,
                LastPolled = t.LastPolled,
                OrderFetchingEnabled = t.OrderFetchingEnabled,
                MonitorCount = t.Monitors.Count,
                LastSyncError = t.LastSyncError
            })
            .ToListAsync();

        return Ok(tenants);
    }

    /// <summary>
    /// Creates a new tenant.
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> CreateTenant([FromBody] CreateTenantRequestDto request)
    {
        await using var context = await contextFactory.CreateDbContextAsync();

        var tenant = new Tenant
        {
            Name = request.Name,
            Type = request.Type,
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
                Type = tenant.Type,
                LitiumBaseUrl = tenant.LitiumBaseUrl,
                CurrentlyFetching = tenant.CurrentlyFetching,
                FetchedFrom = tenant.FetchedFrom,
                FetchedUntil = tenant.FetchedUntil,
                LastPolled = tenant.LastPolled,
                OrderFetchingEnabled = tenant.OrderFetchingEnabled,
                LastSyncError = tenant.LastSyncError
            });
    }

    /// <summary>
    /// Deletes a tenant and reassigns its monitors to the system tenant.
    /// </summary>
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
        if (request.Type.HasValue)
        {
            tenant.Type = request.Type.Value;
        }

        await context.SaveChangesAsync();

        return Ok(new TenantResponseDto()
        {
            Id = tenant.Id,
            Name = tenant.Name,
            Type = tenant.Type,
            LitiumBaseUrl = tenant.LitiumBaseUrl,
            CurrentlyFetching = tenant.CurrentlyFetching,
            FetchedFrom = tenant.FetchedFrom,
            FetchedUntil = tenant.FetchedUntil,
            LastPolled = tenant.LastPolled,
            OrderFetchingEnabled = tenant.OrderFetchingEnabled,
            LastSyncError = tenant.LastSyncError
        });
    }
}
