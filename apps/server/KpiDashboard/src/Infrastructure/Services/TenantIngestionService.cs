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

public class TenantIngestionService(
    IDbContextFactory<AnalyticsDbContext> contextFactory,
    HttpClient httpClient,
    ILogger<TenantIngestionService> logger)
    : ITenantIngestionService
{
    public async Task<int> ExecuteIngestionAsync(Tenant tenant, DateTimeOffset startDate, DateTimeOffset endDate, CancellationToken ct = default)
    {
        await using (var flagContext = await contextFactory.CreateDbContextAsync(ct))
        {
            var dbTenant = await flagContext.Tenants.FirstAsync(t => t.Id == tenant.Id, ct);
            dbTenant.CurrentlyFetching = true;
            await flagContext.SaveChangesAsync(ct);
        }

        try
        {
            return await ExecuteIngestionCoreAsync(tenant, startDate, endDate, ct);
        }
        finally
        {
            try
            {
                await using var cleanupContext = await contextFactory.CreateDbContextAsync(CancellationToken.None);
                var t = await cleanupContext.Tenants.FirstAsync(x => x.Id == tenant.Id);
                t.CurrentlyFetching = false;
                t.LastPolled = DateTimeOffset.UtcNow;
                await cleanupContext.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Failed to clear CurrentlyFetching flag for tenant {TenantId}.", tenant.Id);
            }
        }
    }

    private async Task<int> ExecuteIngestionCoreAsync(Tenant tenant, DateTimeOffset startDate, DateTimeOffset endDate, CancellationToken ct)
    {
        var totalIngested = 0;
        var currentStart = startDate;

        await using var context = await contextFactory.CreateDbContextAsync(ct);

        while (currentStart < endDate)
        {
            var currentEnd = currentStart.AddDays(30);
            if (currentEnd > endDate) currentEnd = endDate;

            var skip = 0;
            var take = 500;
            var hasMoreOrders = true;

            while (hasMoreOrders)
            {
                var sinceParam = Uri.EscapeDataString(currentStart.ToString("O"));
                var untilParam = Uri.EscapeDataString(currentEnd.ToString("O"));
                var requestUrl = $"{tenant.LitiumBaseUrl.TrimEnd('/')}/api/motasticadapter/sync?since={sinceParam}&until={untilParam}&skip={skip}&take={take}";

                var request = new HttpRequestMessage(HttpMethod.Get, requestUrl);
                request.Headers.Add("Authorization", tenant.ServiceAccountToken);
                
                var response = await httpClient.SendAsync(request, ct);
                
                if (!response.IsSuccessStatusCode)
                {
                    logger.LogError("Failed to fetch chunk {Start} to {End} for Tenant {TenantId}. Status: {Status}", currentStart, currentEnd, tenant.Id, response.StatusCode);
                    throw new HttpRequestException($"Failed to fetch chunk. Status: {response.StatusCode}");
                }

                await using var contentStream = await response.Content.ReadAsStreamAsync(ct);
                var litiumPayload = await JsonSerializer.DeserializeAsync<LitiumSyncResponse>(
                    contentStream, new JsonSerializerOptions { PropertyNameCaseInsensitive = true }, ct);

                if (litiumPayload?.Orders != null && litiumPayload.Orders.Count != 0)
                {
                    var count = litiumPayload.Orders.Count;
                    var pIds = new Guid[count];
                    var pTenantIds = new Guid[count];
                    var pOrderStatus = new string[count];
                    var pOrderIds = new string[count];
                    var pDatesCreated = new DateTimeOffset[count];
                    var pIncVat = new decimal?[count];
                    var pExcVat = new decimal?[count];
                    var pCurrencies = new string[count];

                    for (int i = 0; i < count; i++)
                    {
                        var o = litiumPayload.Orders[i]!;
                        pIds[i] = o.Id;
                        pTenantIds[i] = tenant.Id;
                        pOrderStatus[i] = o.OrderStatus!;
                        pOrderIds[i] = o.OrderNumber!;
                        pDatesCreated[i] = o.CreatedDate.ToUniversalTime();
                        pIncVat[i] = o.TotalValueIncludingVat;
                        pExcVat[i] = o.TotalValueExcludingVat;
                        pCurrencies[i] = o.Currency ?? "UNK";
                    }

                    const string sql = @"
                        INSERT INTO orders (id, tenant_id, order_state, litium_order_id, created_date, total_value_inc_vat, total_value_exc_vat, currency)
                        SELECT * FROM UNNEST(@p0, @p1, @p2, @p3, @p4, @p5, @p6, @p7)
                        ON CONFLICT (tenant_id, litium_order_id) 
                        DO UPDATE SET 
                            total_value_inc_vat = EXCLUDED.total_value_inc_vat,
                            total_value_exc_vat = EXCLUDED.total_value_exc_vat,
                            order_state = EXCLUDED.order_state";

                    await context.Database.ExecuteSqlRawAsync(sql, pIds, pTenantIds, pOrderStatus, pOrderIds, pDatesCreated, pIncVat, pExcVat, pCurrencies);
                    totalIngested += count;
                }

                skip += take;
                hasMoreOrders = litiumPayload != null && skip < litiumPayload.TotalOrders;
            }

            currentStart = currentEnd;
        }

        return totalIngested;
    }
}