using Api.DTOs.Tenants;
using Domain.Entities;
using FluentValidation;
using Infrastructure;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Api.Controllers;

[ApiController]
[Route("api/admin")] // Vill vi ha denna route??
public class AdminTenantController(
    IDbContextFactory<AnalyticsDbContext> contextFactory,
    IValidator<CreateTenantRequestDto> createTenantValidator,
    IValidator<UpdateTenantRequestDto> updateTenantValidator) : ControllerBase
{
    [HttpGet("tenants")]
    public async Task<IActionResult> GetTenants()
    {
        await using var context = await contextFactory.CreateDbContextAsync();

        var tenants = await context.Tenants
            .Select(t => new TenantResponseDto()
            {
                Id = t.Id,
                Name = t.Name,
                LitiumBaseUrl = t.LitiumBaseUrl,
                OrderCount = t.OrderCount,
                CurrentlyFetching = t.CurrentlyFetching,
                FetchedFrom = t.FetchedFrom,
                FetchedUntil = t.FetchedUntil,
                LastPolled = t.LastPolled,
                PingReachable = t.PingReachable,
                OrderFetchingEnabled = t.OrderFetchingEnabled
            })
            .ToListAsync();

        return Ok(tenants);
    }

    [HttpGet("tenants/{id:guid}")]
    public async Task<IActionResult> GetTenant(Guid id)
    {
        await using var context = await contextFactory.CreateDbContextAsync();

        var tenant = await context.Tenants
            .Where(t => t.Id == id)
            .Select(t => new TenantResponseDto()
            {
                Id = t.Id,
                Name = t.Name,
                LitiumBaseUrl = t.LitiumBaseUrl,
                OrderCount = t.OrderCount,
                CurrentlyFetching = t.CurrentlyFetching,
                FetchedFrom = t.FetchedFrom,
                FetchedUntil = t.FetchedUntil,
                LastPolled = t.LastPolled,
                PingReachable = t.PingReachable,
                OrderFetchingEnabled = t.OrderFetchingEnabled
            })
            .FirstOrDefaultAsync();

        if (tenant == null)
        {
            return NotFound();
        }

        return Ok(tenant);
    }

    [HttpPost("create-tenant")]
    public async Task<IActionResult> CreateTenant([FromBody] CreateTenantRequestDto request)
    {
        var validationResult = await createTenantValidator.ValidateAsync(request);
        if (!validationResult.IsValid)
        {
            return BadRequest(validationResult.Errors);
        }

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

        return CreatedAtAction(nameof(GetTenant), new { id = tenant.Id }, new TenantResponseDto()
            {
                Id = tenant.Id,
                Name = tenant.Name,
                LitiumBaseUrl = tenant.LitiumBaseUrl,
                OrderCount = tenant.OrderCount,
                CurrentlyFetching = tenant.CurrentlyFetching,
                FetchedFrom = tenant.FetchedFrom,
                FetchedUntil = tenant.FetchedUntil,
                LastPolled = tenant.LastPolled,
                PingReachable = tenant.PingReachable,
                OrderFetchingEnabled = tenant.OrderFetchingEnabled
            });
    }

    [HttpDelete("tenants/{id:guid}")]
    public async Task<IActionResult> DeleteTenant(Guid id)
    {
        await using var context = await contextFactory.CreateDbContextAsync();
        var tenant = await context.Tenants.FindAsync(id);
        if (tenant == null)
        {
            return NotFound();
        }

        context.Tenants.Remove(tenant);
        await context.SaveChangesAsync();
        return NoContent();
    }
    
    [HttpPatch("tenants/{id:guid}")]
    public async Task<IActionResult> UpdateTenant(Guid id, [FromBody] UpdateTenantRequestDto request)
    {
        var validationResult = await updateTenantValidator.ValidateAsync(request);
        if (!validationResult.IsValid)
        {
            return BadRequest(validationResult.Errors);
        }

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
            OrderCount = tenant.OrderCount,
            CurrentlyFetching = tenant.CurrentlyFetching,
            FetchedFrom = tenant.FetchedFrom,
            FetchedUntil = tenant.FetchedUntil,
            LastPolled = tenant.LastPolled,
            PingReachable = tenant.PingReachable,
            OrderFetchingEnabled = tenant.OrderFetchingEnabled
        });
    }
}
