using Domain.Entities;
using Infrastructure;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Api.Controllers;

[ApiController]
[Route("api/admin/tenants")] // Vill vi ha denna route??
public class AdminTenantController(IDbContextFactory<AnalyticsDbContext> contextFactory) : ControllerBase
{
    [HttpGet("GetTenants")]
    public async Task<IActionResult> GetTenants()
    {
        await using var context = await contextFactory.CreateDbContextAsync();

        var tenants = await context.Tenants
            .Select(t => new TenantResponse
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

    [HttpGet("{id:guid}/GetTenant")]
    public async Task<IActionResult> GetTenant(Guid id)
    {
        await using var context = await contextFactory.CreateDbContextAsync();

        var tenant = await context.Tenants
            .Where(t => t.Id == id)
            .Select(t => new TenantResponse
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

    [HttpPost("CreateTenant")]
    public async Task<IActionResult> CreateTenant([FromBody] CreateTenantRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return BadRequest("Name is required.");
        }

        if (string.IsNullOrWhiteSpace(request.LitiumBaseUrl))
        {
            return BadRequest("LitiumBaseUrl is required.");
        }

        if (string.IsNullOrWhiteSpace(request.ServiceAccountToken))
        {
            return BadRequest("ServiceAccountToken is required.");
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

        return CreatedAtAction(nameof(GetTenant), new { id = tenant.Id }, new TenantResponse
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

    public class CreateTenantRequest
    {
        public string Name { get; set; } = string.Empty;
        public string LitiumBaseUrl { get; set; } = string.Empty;
        public string ServiceAccountToken { get; set; } = string.Empty;
        public bool OrderFetchingEnabled { get; set; } = false;
    }
    public class TenantResponse
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string LitiumBaseUrl { get; set; } = string.Empty;
        public int OrderCount { get; set; }
        public bool CurrentlyFetching { get; set; }
        public DateTimeOffset? FetchedFrom { get; set; }
        public DateTimeOffset? FetchedUntil { get; set; }
        public DateTimeOffset? LastPolled { get; set; }
        public bool? PingReachable { get; set; }
        public bool OrderFetchingEnabled { get; set; }
    }
}