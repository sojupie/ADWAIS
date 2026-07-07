using Adwais.Application.Common.Models;
using Adwais.Application.DTOs.Financial;
using Adwais.Domain.Entities;
using Adwais.Domain.Entities.OrderData;

namespace Adwais.Application.Interfaces;

public interface IFinancialService
{
    /// <summary>
    /// Calculates key performance indicators (KPIs) for the specified timeframe and tenant.
    /// </summary>
    Task<KpiDto> GetKpisAsync(ResolvedPeriod period, Guid? tenantId = null, CancellationToken ct = default);

    /// <summary>
    /// Retrieves revenue velocity points for the specified timeframe.
    /// </summary>
    Task<IReadOnlyList<VelocityPointDto>> GetVelocityAsync(ResolvedPeriod period, Guid? tenantId = null, CancellationToken ct = default);

    /// <summary>
    /// Retrieves running accumulated revenue for current and previous periods.
    /// </summary>
    Task<IReadOnlyList<AccumulatedRevenuePointDto>> GetAccumulatedRevenueAsync(ResolvedPeriod period, Guid? tenantId = null, CancellationToken ct = default);

    /// <summary>
    /// Identifies tenants with the most extreme growth.
    /// </summary>
    Task<IReadOnlyList<GrowthExtremeDto>> GetGrowthExtremesAsync(ResolvedPeriod period, CancellationToken ct = default);

    /// <summary>
    /// Analyzes revenue efficiency across all tenants, returning AOV, portfolio share, and growth velocity.
    /// </summary>
    Task<RevenueEfficiencyDto> GetRevenueEfficiencyAsync(ResolvedPeriod period, CancellationToken ct = default);

    /// <summary>
    /// Analyzes order volume anomalies by comparing current volume against a baseline period.
    /// </summary>
    Task<IReadOnlyList<VolumeAnomalyDto>> GetVolumeAnomalyAsync(ResolvedPeriod period, CancellationToken ct = default);

    /// <summary>
    /// Analyzes revenue momentum across all tenants.
    /// </summary>
    Task<MomentumDto> GetMomentumAsync(ResolvedPeriod period, CancellationToken ct = default);

    /// <summary>
    /// Calculates net growth addition (revenue delta) for a specific tenant.
    /// </summary>
    Task<IReadOnlyList<NetGrowthAdditionPointDto>> GetNetGrowthAdditionAsync(ResolvedPeriod period, Guid tenantId, CancellationToken ct = default);

    /// <summary>
    /// Generates a distribution histogram of order values for a specific tenant.
    /// </summary>
    Task<IReadOnlyList<OrderBinDto>> GetOrderDistributionAsync(ResolvedPeriod period, Guid tenantId, int? binCount = null, CancellationToken ct = default);

    /// <summary>
    /// Analyzes transaction density by day of week and hour of day.
    /// </summary>
    Task<IReadOnlyList<TransactionDensityPointDto>> GetTransactionDensityAsync(ResolvedPeriod period, Guid? tenantId = null, CancellationToken ct = default);

    /// <summary>
    /// Calculates the cumulative growth delta for the specified timeframe.
    /// </summary>
    Task<IReadOnlyList<CumulativeGrowthDeltaPointDto>> GetCumulativeGrowthDeltaAsync(ResolvedPeriod period, Guid? tenantId = null, CancellationToken ct = default);

    Task<IReadOnlyList<OrderDto>> GetOrdersAsync(DateTimeOffset dateSince, DateTimeOffset dateUntil, int ceilingCount, CancellationToken ct);
}
