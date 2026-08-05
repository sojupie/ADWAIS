using Microsoft.EntityFrameworkCore;
using Adwais.Application.DTOs.Financial.Upstream;
using Adwais.Domain;
using Adwais.Domain.Entities;
using Adwais.Infrastructure.Persistence;
using Microsoft.Extensions.Logging;

using Adwais.Application.Interfaces;

namespace Adwais.Infrastructure.Services;

public class LitiumIngestionService(
    IDbContextFactory<AnalyticsDbContext> contextFactory,
    IEnumerable<IOrderSource> orderSources,
    ILogger<LitiumIngestionService> logger,
    ISystemEventService eventService)
    : ILitiumIngestionService
{
    public async Task<int> ExecuteIngestionAsync(Guid tenantId, DateTimeOffset startDate, DateTimeOffset endDate, CancellationToken ct = default)
    {
        Tenant tenant;
        await using (var context = await contextFactory.CreateDbContextAsync(ct))
        {
            tenant = await context.Tenants.FirstAsync(t => t.Id == tenantId, ct);
        }

        try
        {
            var result = await ExecuteIngestionCoreAsync(tenant, orderSources.ForProvider(tenant.OrderProvider), startDate, endDate, ct);
            
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

    private async Task<int> ExecuteIngestionCoreAsync(Tenant tenant, IOrderSource orderSource, DateTimeOffset startDate, DateTimeOffset endDate, CancellationToken ct)
    {
        if (tenant.LitiumBaseUrl == null || tenant.ServiceAccountToken == null)
            throw new InvalidOperationException("Litium credentials are missing.");
        var sourceSettings = new OrderSourceSettings(tenant.LitiumBaseUrl, tenant.ServiceAccountToken);
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
                IReadOnlyList<OrderSourceOrder> orders;
                try
                {
                    orders = await orderSource.FetchOrdersAsync(sourceSettings, currentStart, currentEnd, take, ct);
                }
                catch (HttpRequestException ex)
                {
                    logger.LogError(ex, "Failed to fetch chunk {Start} to {End} for Tenant {TenantId}.", currentStart, currentEnd, tenant.Id);
                    throw;
                }

                if (orders.Count != 0)
                {
                    var count = orders.Count;
                    var pIds = new Guid[count];
                    var pTenantIds = new Guid[count];
                    var pProviders = new string[count];
                    var pExternalIds = new string[count];
                    var pOrderStatus = new string[count];
                    var pOrderIds = new string[count];
                    var pDatesCreated = new DateTimeOffset[count];
                    var pIncVat = new decimal?[count];
                    var pExcVat = new decimal?[count];
                    var pCurrencies = new string[count];

                    for (int i = 0; i < count; i++)
                    {
                        var o = orders[i];
                        pIds[i] = Guid.NewGuid();
                        pTenantIds[i] = tenant.Id;
                        pProviders[i] = orderSource.Provider;
                        pExternalIds[i] = o.ExternalId;
                        pOrderStatus[i] = o.State.ToString();
                        pOrderIds[i] = o.OrderNumber;
                        pDatesCreated[i] = o.CreatedDate;
                        pIncVat[i] = o.TotalValueIncludingVat;
                        pExcVat[i] = o.TotalValueExcludingVat;
                        pCurrencies[i] = o.Currency;
                    }

                    await UpsertOrdersAsync(dbContext, pIds, pTenantIds, pProviders, pExternalIds, pOrderStatus, pOrderIds, pDatesCreated, pIncVat, pExcVat, pCurrencies);
                    totalIngested += count;

                    // Advance cursor to the exact timestamp of the final order in this payload
                    var nextCursor = orders[^1].CreatedDate;
                    currentStart = nextCursor == currentStart ? currentStart.AddTicks(1) : nextCursor;
                }

                hasMoreOrders = orders.Count == take;
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
        var provider = await dbContext.Tenants
            .Where(tenant => tenant.Id == tenantId)
            .Select(tenant => tenant.OrderProvider)
            .SingleAsync(ct);
        if (!provider.Equals(IntegrationProviders.Litium, StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException($"Tenant is configured for order provider '{provider}', not '{IntegrationProviders.Litium}'.");
        var orderSource = orderSources.ForProvider(provider);

        var normalized = LitiumOrderSource.Normalize(order);

        var pIds = new[] { Guid.NewGuid() };
        var pTenantIds = new[] { tenantId };
        var pProviders = new[] { orderSource.Provider };
        var pExternalIds = new[] { normalized.ExternalId };
        var pOrderStatus = new[] { normalized.State.ToString() };
        var pOrderIds = new[] { normalized.OrderNumber };
        var pDatesCreated = new[] { normalized.CreatedDate };
        var pIncVat = new[] { normalized.TotalValueIncludingVat };
        var pExcVat = new[] { normalized.TotalValueExcludingVat };
        var pCurrencies = new[] { normalized.Currency };

        await UpsertOrdersAsync(dbContext, pIds, pTenantIds, pProviders, pExternalIds, pOrderStatus, pOrderIds, pDatesCreated, pIncVat, pExcVat, pCurrencies);
    }

    private static async Task UpsertOrdersAsync(
        AnalyticsDbContext dbContext,
        Guid[] ids, Guid[] tenantIds, string[] providers, string[] externalIds, string[] orderStatuses,
        string[] orderNumbers, DateTimeOffset[] datesCreated,
        decimal?[] incVats, decimal?[] excVats, string[] currencies)
    {
        if (!dbContext.Database.IsRelational()) return;

        const string sql = @"
            INSERT INTO orders (id, tenant_id, provider, external_id, order_state, order_number, created_date, total_value_inc_vat, total_value_exc_vat, currency)
            SELECT * FROM UNNEST(@p0, @p1, @p2, @p3, @p4, @p5, @p6, @p7, @p8, @p9)
            ON CONFLICT (tenant_id, provider, external_id)
            DO UPDATE SET 
                total_value_inc_vat = EXCLUDED.total_value_inc_vat,
                total_value_exc_vat = EXCLUDED.total_value_exc_vat,
                order_state = EXCLUDED.order_state";

        await dbContext.Database.ExecuteSqlRawAsync(sql, ids, tenantIds, providers, externalIds, orderStatuses, orderNumbers, datesCreated, incVats, excVats, currencies);
    }
}

