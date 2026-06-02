using Adwais.Application.Common.Models;
using Adwais.Application.DTOs.Financial;
using Adwais.Domain.Entities;

namespace Adwais.Application.Interfaces;

public interface IFinancialService
{
    /// <summary>
    /// Calculates key performance indicators (KPIs) for the specified timeframe and tenant.
    /// </summary>
    Task<KpiDto> GetKpisAsync(ResolvedPeriod period, Guid? tenantId = null);

    /// <summary>
    /// Retrieves revenue velocity points for the specified timeframe.
    /// </summary>
    Task<IReadOnlyList<VelocityPointDto>> GetVelocityAsync(ResolvedPeriod period, Guid? tenantId = null);

    /// <summary>
    /// Retrieves running accumulated revenue for current and previous periods.
    /// </summary>
    Task<IReadOnlyList<AccumulatedRevenuePointDto>> GetAccumulatedRevenueAsync(ResolvedPeriod period, Guid? tenantId = null);

    /// <summary>
    /// Identifies tenants with the most extreme growth.
    /// </summary>
    Task<IReadOnlyList<GrowthExtremeDto>> GetGrowthExtremesAsync(ResolvedPeriod period);

    /// <summary>
    /// Analyzes revenue efficiency across all tenants, returning AOV, portfolio share, and growth velocity.
    /// </summary>
    Task<RevenueEfficiencyDto> GetRevenueEfficiencyAsync(ResolvedPeriod period);

    /// <summary>
    /// Analyzes order volume anomalies by comparing current volume against a baseline period.
    /// </summary>
    Task<IReadOnlyList<VolumeAnomalyDto>> GetVolumeAnomalyAsync(ResolvedPeriod period);

    /// <summary>
    /// Analyzes revenue momentum across all tenants.
    /// </summary>
    Task<MomentumDto> GetMomentumAsync(ResolvedPeriod period);

    /// <summary>
    /// Calculates net growth addition (revenue delta) for a specific tenant.
    /// </summary>
    Task<IReadOnlyList<NetGrowthAdditionPointDto>> GetNetGrowthAdditionAsync(ResolvedPeriod period, Guid tenantId);

    /// <summary>
    /// Generates a distribution histogram of order values for a specific tenant.
    /// </summary>
    Task<IReadOnlyList<OrderBinDto>> GetOrderDistributionAsync(ResolvedPeriod period, Guid tenantId, int? binCount = null);

    /// <summary>
    /// Analyzes transaction density by day of week and hour of day.
    /// </summary>
    Task<IReadOnlyList<TransactionDensityPointDto>> GetTransactionDensityAsync(ResolvedPeriod period, Guid? tenantId = null);

    /// <summary>
    /// Calculates the cumulative growth delta for the specified timeframe.
    /// </summary>
    Task<IReadOnlyList<CumulativeGrowthDeltaPointDto>> GetCumulativeGrowthDeltaAsync(ResolvedPeriod period, Guid? tenantId = null);
}
