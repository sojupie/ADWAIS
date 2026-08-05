using Adwais.Api.DTOs.Tenants;
using Adwais.Api.DTOs.Monitoring;
using Adwais.Domain;
using Adwais.Domain.Entities;
using FluentValidation;
using Adwais.Application.Common.Interfaces;
using Adwais.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Adwais.Api.Controllers;

/// <summary>
/// Manages tenant lifecycle and configuration.
/// </summary>
[ApiController]
[Route("api/tenants")]
public class TenantController(
    IApplicationDbContext dbContext,
    IMonitorOrchestrationService monitorService) : ControllerBase
{
    private readonly IApplicationDbContext _dbContext = dbContext;
    private readonly IMonitorOrchestrationService _monitorService = monitorService;

    /// <summary>
    /// Retrieves tenants, optionally filtered by ID.
    /// </summary>
    /// <param name="id">Optional tenant ID to retrieve a single tenant.</param>
    [HttpGet]
    [Authorize(Policy = "KioskOrStaffAccess")]
    public async Task<ActionResult<IEnumerable<TenantResponseDto>>> GetTenants([FromQuery] Guid? id)
    {
        var context = _dbContext;

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
                    OrderProvider = t.OrderProvider,
                    ImageUrl = t.ImageUrl,
                    CurrentlyFetching = t.CurrentlyFetching,
                    FetchedFrom = t.FetchedFrom,
                    FetchedUntil = t.FetchedUntil,
                    LastPolled = t.LastPolled,
                    OrderFetchingEnabled = t.OrderFetchingEnabled,
                    MonitorCount = t.Monitors.Count,
                    LastSyncError = t.LastSyncError,
                    HasServiceAccountToken = !string.IsNullOrWhiteSpace(t.ServiceAccountToken) && t.ServiceAccountToken != "N/A" && !t.ServiceAccountToken.StartsWith("mock-token-")
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
                OrderProvider = t.OrderProvider,
                ImageUrl = t.ImageUrl,
                CurrentlyFetching = t.CurrentlyFetching,
                FetchedFrom = t.FetchedFrom,
                FetchedUntil = t.FetchedUntil,
                LastPolled = t.LastPolled,
                OrderFetchingEnabled = t.OrderFetchingEnabled,
                MonitorCount = t.Monitors.Count,
                LastSyncError = t.LastSyncError,
                HasServiceAccountToken = !string.IsNullOrWhiteSpace(t.ServiceAccountToken) && t.ServiceAccountToken != "N/A" && !t.ServiceAccountToken.StartsWith("mock-token-")
            })
            .ToListAsync();

        return Ok(tenants);
    }

    /// <summary>
    /// Creates a new tenant.
    /// </summary>
    [HttpPost]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> CreateTenant([FromBody] CreateTenantRequestDto request)
    {
        var context = _dbContext;

        var tenant = new Tenant
        {
            Name = request.Name,
            Type = request.Type,
            LitiumBaseUrl = request.LitiumBaseUrl,
            OrderProvider = string.IsNullOrWhiteSpace(request.OrderProvider)
                ? IntegrationProviders.Litium
                : request.OrderProvider.Trim().ToLowerInvariant(),
            ImageUrl = request.ImageUrl,
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
                OrderProvider = tenant.OrderProvider,
                ImageUrl = tenant.ImageUrl,
                CurrentlyFetching = tenant.CurrentlyFetching,
                FetchedFrom = tenant.FetchedFrom,
                FetchedUntil = tenant.FetchedUntil,
                LastPolled = tenant.LastPolled,
                OrderFetchingEnabled = tenant.OrderFetchingEnabled,
                LastSyncError = tenant.LastSyncError,
                HasServiceAccountToken = !string.IsNullOrWhiteSpace(tenant.ServiceAccountToken) && tenant.ServiceAccountToken != "N/A" && !tenant.ServiceAccountToken.StartsWith("mock-token-")
            });
    }

    /// <summary>
    /// Deletes a tenant and reassigns its monitors to the system tenant.
    /// </summary>
    [HttpDelete("{id:guid}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> DeleteTenant(Guid id)
    {
        if (id == IApplicationDbContext.SystemTenantGuid)
        {
            return BadRequest("Cannot delete the system tenant.");
        }

        var context = _dbContext;
        var tenant = await context.Tenants.FindAsync(id);
        if (tenant == null)
        {
            return NotFound();
        }
        
        await _monitorService.ReassignAllTenantMonitorsToSystemAsync(id);

        context.Tenants.Remove(tenant);
        await context.SaveChangesAsync();
        return NoContent();
    }
    
    /// <summary>
    /// Partially updates a tenant's configuration.
    /// </summary>
    [HttpPatch("{id:guid}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> UpdateTenant(Guid id, [FromBody] UpdateTenantRequestDto request)
    {
        var context = _dbContext;

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
            tenant.LitiumBaseUrl = string.IsNullOrWhiteSpace(request.LitiumBaseUrl) ? null : request.LitiumBaseUrl.Trim();
        }

        if (request.OrderProvider is not null)
        {
            tenant.OrderProvider = request.OrderProvider.Trim().ToLowerInvariant();
        }
        if (request.ImageUrl is not null)
        {
            tenant.ImageUrl = string.IsNullOrWhiteSpace(request.ImageUrl) ? null : request.ImageUrl.Trim();
        }
        if (request.ServiceAccountToken is not null)
        {
            tenant.ServiceAccountToken = string.IsNullOrWhiteSpace(request.ServiceAccountToken) ? null : request.ServiceAccountToken;
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
            OrderProvider = tenant.OrderProvider,
            ImageUrl = tenant.ImageUrl,
            CurrentlyFetching = tenant.CurrentlyFetching,
            FetchedFrom = tenant.FetchedFrom,
            FetchedUntil = tenant.FetchedUntil,
            LastPolled = tenant.LastPolled,
            OrderFetchingEnabled = tenant.OrderFetchingEnabled,
            LastSyncError = tenant.LastSyncError,
            HasServiceAccountToken = !string.IsNullOrWhiteSpace(tenant.ServiceAccountToken) && tenant.ServiceAccountToken != "N/A" && !tenant.ServiceAccountToken.StartsWith("mock-token-")
        });
    }
}
