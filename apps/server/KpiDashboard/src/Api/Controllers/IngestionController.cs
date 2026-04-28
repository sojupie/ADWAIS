using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using Api.Models;
using Infrastructure;
using Domain.Entities;

namespace Api.Controllers;

[ApiController]
[Route("[controller]")]
public class IngestionController : ControllerBase
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;
    private readonly IDbContextFactory<AnalyticsDbContext> _contextFactory;

    public IngestionController(
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration,
        IDbContextFactory<AnalyticsDbContext> contextFactory)
    {
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
        _contextFactory = contextFactory;
    }

    [HttpPost("backfill")]
    public async Task<IActionResult> ExecuteHistoricalBackfill([FromQuery] Guid tenantId,
        [FromQuery] DateTimeOffset startDate, [FromQuery] DateTimeOffset endDate)
    {
        var targetUrl = _configuration["SYNC_TARGET_URL"];
        var authHeader = _configuration["SYNC_AUTH_HEADER"];

        if (string.IsNullOrEmpty(targetUrl) || string.IsNullOrEmpty(authHeader))
        {
            return StatusCode(500, "Configuration constraint violation: Sync variables missing.");
        }

        if (startDate >= endDate)
        {
            return BadRequest("startDate must be before endDate");
        }

        var client = _httpClientFactory.CreateClient();
        client.DefaultRequestHeaders.Add("Authorization", authHeader);

        int totalIngested = 0;
        var currentStart = startDate;

        using var context = await _contextFactory.CreateDbContextAsync();

        // 30-day pagination to bypass Litium.MotasticAdapter limit
        while (currentStart < endDate)
        {
            var currentEnd = currentStart.AddDays(30);
            if (currentEnd > endDate)
            {
                currentEnd = endDate;
            }

            var sinceParam = Uri.EscapeDataString(currentStart.ToString("O"));
            var untilParam = Uri.EscapeDataString(currentEnd.ToString("O"));
            var requestUrl = $"{targetUrl}?since={sinceParam}&until={untilParam}";

            var response = await client.GetAsync(requestUrl);
            if (!response.IsSuccessStatusCode)
            {
                return StatusCode((int)response.StatusCode, $"Failed to fetch chunk {currentStart} to {currentEnd}.");
            }

            var contentStream = await response.Content.ReadAsStreamAsync();
            var litiumPayload = await JsonSerializer.DeserializeAsync<LitiumSyncResponse>(
                contentStream, new JsonSerializerOptions { PropertyNameCaseInsensitive = true }
            );

            if (litiumPayload?.Orders != null && litiumPayload.Orders.Any())
            {
                int count = litiumPayload.Orders.Count;
                var pTenantIds = new Guid[count];
                var pOrderIds = new string[count];
                var pDates = new DateTimeOffset[count];
                var pIncVat = new int[count];
                var pExcVat = new int[count];
                var pCurrencies = new string[count];

                for (int i = 0; i < count; i++)
                {
                    var o = litiumPayload.Orders[i];
                    pTenantIds[i] = tenantId;
                    pOrderIds[i] = o.Id;
                    pDates[i] = o.CreatedDate.ToUniversalTime();
                    pIncVat[i] = (int)o.TotalValueIncludingVat;
                    pExcVat[i] = (int)o.TotalValueExcludingVat;
                    pCurrencies[i] = o.Currency ?? "UNK";
                }

                var sql = @"
                    INSERT INTO orders (tenant_id, litium_order_id, created_date, total_value_inc_vat, total_value_exc_vat, currency)
                    SELECT * FROM UNNEST(@p0, @p1, @p2, @p3, @p4, @p5)
                    ON CONFLICT (tenant_id, litium_order_id) 
                    DO UPDATE SET 
                        total_value_inc_vat = EXCLUDED.total_value_inc_vat,
                        total_value_exc_vat = EXCLUDED.total_value_exc_vat,
                        currency = EXCLUDED.currency";

                await context.Database.ExecuteSqlRawAsync(sql, 
                    pTenantIds, 
                    pOrderIds, 
                    pDates, 
                    pIncVat, 
                    pExcVat, 
                    pCurrencies);

                totalIngested += count;
            }

            currentStart = currentEnd;
        }

        return Ok(new { IngestedCount = totalIngested });
    }
}