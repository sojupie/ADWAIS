using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using Adwais.Application.DTOs.Financial.Upstream;
using Adwais.Domain.Entities;
using Adwais.Domain.Enums;
using Adwais.Infrastructure.Persistence;
using Microsoft.Extensions.Logging;

using Adwais.Application.Interfaces;

namespace Adwais.Infrastructure.Services;

public class LitiumIngestionService(
    IDbContextFactory<AnalyticsDbContext> contextFactory,
    HttpClient httpClient,
    ILogger<LitiumIngestionService> logger,
    ISystemEventService eventService)
    : ILitiumIngestionService
{
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };

    public async Task<int> ExecuteIngestionAsync(Guid tenantId, DateTimeOffset startDate, DateTimeOffset endDate, CancellationToken ct = default)
    {
        Tenant tenant;
        await using (var context = await contextFactory.CreateDbContextAsync(ct))
        {
            tenant = await context.Tenants.FirstAsync(t => t.Id == tenantId, ct);
        }

        try
        {
            var result = await ExecuteIngestionCoreAsync(tenant, startDate, endDate, ct);
            
            await using (var context = await contextFactory.CreateDbContextAsync(ct))
            {
                var t = await context.Tenants.FirstAsync(x => x.Id == tenantId, ct);
                t.LastSyncError = null;
                await context.SaveChangesAsync(ct);
            }

            if (result > 0)
            {
                await eventService.LogAsync(nameof(LitiumIngestionService), $"Successfully ingested {result} orders.", SystemEventLevel.Information, $"Period: {startDate:O} to {endDate:O}", tenantId);
            }
            
            return result;
        }
        catch (Exception ex)
        {
            var step = ex.Data.Contains("Step") ? ex.Data["Step"]?.ToString() : "Executing Ingestion Core";
            var detailedErrorMessage = $"Failed during step '{step}': {ex.Message}";
            
            await eventService.LogErrorAsync(nameof(LitiumIngestionService), $"Ingestion failed: {detailedErrorMessage}", ex, tenantId);
            
            try
            {
                await using var errorContext = await contextFactory.CreateDbContextAsync(CancellationToken.None);
                var t = await errorContext.Tenants.FirstAsync(x => x.Id == tenantId, CancellationToken.None);
                t.LastSyncError = detailedErrorMessage;
                await errorContext.SaveChangesAsync(CancellationToken.None);
            }
            catch (Exception innerEx)
            {
                logger.LogError(innerEx, "Failed to record error in Tenant {TenantId}.", tenantId);
            }

            throw;
        }
        finally
        {
            try
            {
                await using var cleanupContext = await contextFactory.CreateDbContextAsync(CancellationToken.None);
                var t = await cleanupContext.Tenants.FirstAsync(x => x.Id == tenantId, cancellationToken: CancellationToken.None);
                t.CurrentlyFetching = false;
                t.LastPolled = DateTimeOffset.UtcNow;
                await cleanupContext.SaveChangesAsync(CancellationToken.None);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Failed to clear CurrentlyFetching flag for tenant {TenantId}.", tenantId);
            }
        }
    }

    private async Task<int> ExecuteIngestionCoreAsync(Tenant tenant, DateTimeOffset startDate, DateTimeOffset endDate, CancellationToken ct)
    {
        var totalIngested = 0;
        var currentStart = startDate;

        await using var dbContext = await contextFactory.CreateDbContextAsync(ct);

        while (currentStart < endDate)
        {
            var currentEnd = currentStart.AddDays(30);
            if (currentEnd > endDate) currentEnd = endDate;

            var chunkStart = currentStart;
            var take = 500;
            var hasMoreOrders = true;

            while (hasMoreOrders)
            {
                var sinceParam = Uri.EscapeDataString(currentStart.ToString("O"));
                var untilParam = Uri.EscapeDataString(currentEnd.ToString("O"));
                var requestUrl = $"{tenant.LitiumBaseUrl.TrimEnd('/')}/api/motasticadapter/sync?since={sinceParam}&until={untilParam}&skip=0&take={take}";

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
                    contentStream, JsonOptions, ct);

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
                        
                        if (!Enum.TryParse<OrderState>(o.OrderStatus, true, out var orderState))
                        {
                            orderState = OrderState.Unknown;
                        }
                        pOrderStatus[i] = orderState.ToString();
                        
                        pOrderIds[i] = o.OrderNumber;
                        pDatesCreated[i] = o.CreatedDate.ToUniversalTime();
                        pIncVat[i] = o.TotalValueIncludingVat;
                        pExcVat[i] = o.TotalValueExcludingVat;
                        pCurrencies[i] = o.Currency ?? "UNK";
                    }

                    await UpsertOrdersAsync(dbContext, pIds, pTenantIds, pOrderStatus, pOrderIds, pDatesCreated, pIncVat, pExcVat, pCurrencies);
                    totalIngested += count;

                    // Advance cursor to the exact timestamp of the final order in this payload
                    var nextCursor = litiumPayload.Orders!.Last()!.CreatedDate.ToUniversalTime();
                    currentStart = nextCursor == currentStart ? currentStart.AddTicks(1) : nextCursor;
                }

                hasMoreOrders = litiumPayload?.Orders != null && litiumPayload.Orders.Count == take;
            }

            var t = await dbContext.Tenants.SingleAsync(x => x.Id == tenant.Id, cancellationToken: ct);
            t.FetchedFrom = t.FetchedFrom == null ? chunkStart : (chunkStart < t.FetchedFrom ? chunkStart : t.FetchedFrom);                                                                                  
            t.FetchedUntil = t.FetchedUntil == null ? currentEnd : (currentEnd > t.FetchedUntil ? currentEnd : t.FetchedUntil);                                                                                    
            await dbContext.SaveChangesAsync(ct);      

            currentStart = currentEnd;
        }

        return totalIngested;
    }

    public async Task IngestSingleOrderAsync(Guid tenantId, LitiumSyncResponse.LitiumOrderDto order, CancellationToken ct = default)
    {
        await using var dbContext = await contextFactory.CreateDbContextAsync(ct);

        if (!Enum.TryParse<OrderState>(order.OrderStatus, true, out var orderState))
        {
            orderState = OrderState.Unknown;
        }

        var pIds = new[] { order.Id };
        var pTenantIds = new[] { tenantId };
        var pOrderStatus = new[] { orderState.ToString() };
        var pOrderIds = new[] { order.OrderNumber };
        var pDatesCreated = new[] { order.CreatedDate.ToUniversalTime() };
        var pIncVat = new[] { order.TotalValueIncludingVat };
        var pExcVat = new[] { order.TotalValueExcludingVat };
        var pCurrencies = new[] { order.Currency ?? "UNK" };

        await UpsertOrdersAsync(dbContext, pIds, pTenantIds, pOrderStatus, pOrderIds, pDatesCreated, pIncVat, pExcVat, pCurrencies);
    }

    private static async Task UpsertOrdersAsync(
        AnalyticsDbContext dbContext,
        Guid[] ids, Guid[] tenantIds, string[] orderStatuses,
        string[] orderNumbers, DateTimeOffset[] datesCreated,
        decimal?[] incVats, decimal?[] excVats, string[] currencies)
    {
        if (!dbContext.Database.IsRelational()) return;

        const string sql = @"
            INSERT INTO orders (id, tenant_id, order_state, litium_order_id, created_date, total_value_inc_vat, total_value_exc_vat, currency)
            SELECT * FROM UNNEST(@p0, @p1, @p2, @p3, @p4, @p5, @p6, @p7)
            ON CONFLICT (tenant_id, litium_order_id) 
            DO UPDATE SET 
                total_value_inc_vat = EXCLUDED.total_value_inc_vat,
                total_value_exc_vat = EXCLUDED.total_value_exc_vat,
                order_state = EXCLUDED.order_state";

        await dbContext.Database.ExecuteSqlRawAsync(sql, ids, tenantIds, orderStatuses, orderNumbers, datesCreated, incVats, excVats, currencies);
    }
}

