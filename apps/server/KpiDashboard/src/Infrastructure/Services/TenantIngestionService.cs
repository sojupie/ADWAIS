using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using Domain.Entities.LitiumDTO;
using Domain.Entities;
using Infrastructure;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Services;

public interface ITenantIngestionService
{
    Task<int> ExecuteIngestionAsync(Tenant tenant, DateTimeOffset startDate, DateTimeOffset endDate, CancellationToken ct = default);
}

public class TenantIngestionService : ITenantIngestionService
{
    private readonly IDbContextFactory<AnalyticsDbContext> _contextFactory;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<TenantIngestionService> _logger;

    public TenantIngestionService(
        IDbContextFactory<AnalyticsDbContext> contextFactory,
        IHttpClientFactory httpClientFactory,
        ILogger<TenantIngestionService> logger)
    {
        _contextFactory = contextFactory;
        _httpClientFactory = httpClientFactory;
        _logger = logger;
    }

    public async Task<int> ExecuteIngestionAsync(Tenant tenant, DateTimeOffset startDate, DateTimeOffset endDate, CancellationToken ct = default)
    {
        var client = _httpClientFactory.CreateClient();
        client.DefaultRequestHeaders.Add("Authorization", tenant.ServiceAccountToken);

        int totalIngested = 0;
        var currentStart = startDate;

        using var context = await _contextFactory.CreateDbContextAsync(ct);

        while (currentStart < endDate)
        {
            var currentEnd = currentStart.AddDays(30);
            if (currentEnd > endDate) currentEnd = endDate;

            var sinceParam = Uri.EscapeDataString(currentStart.ToString("O"));
            var untilParam = Uri.EscapeDataString(currentEnd.ToString("O"));
            var requestUrl = $"{tenant.LitiumBaseUrl.TrimEnd('/')}/api/motasticadapter/sync?since={sinceParam}&until={untilParam}";

            var response = await client.GetAsync(requestUrl, ct);
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError("Failed to fetch chunk {Start} to {End} for Tenant {TenantId}. Status: {Status}", currentStart, currentEnd, tenant.Id, response.StatusCode);
                throw new HttpRequestException($"Failed to fetch chunk. Status: {response.StatusCode}");
            }

            using var contentStream = await response.Content.ReadAsStreamAsync(ct);
            var litiumPayload = await JsonSerializer.DeserializeAsync<LitiumSyncResponse>(
                contentStream, new JsonSerializerOptions { PropertyNameCaseInsensitive = true }, ct);

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
                    pTenantIds[i] = tenant.Id;
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

                await context.Database.ExecuteSqlRawAsync(sql, pTenantIds, pOrderIds, pDates, pIncVat, pExcVat, pCurrencies);
                totalIngested += count;
            }

            currentStart = currentEnd;
        }

        return totalIngested;
    }
}