using Adwais.Domain.DTOs.Financial;
using Adwais.Domain.Enums;

namespace Adwais.Infrastructure.Services.Financial;

public interface IFinancialService
{
    /// <summary>
    /// Calculates key performance indicators (KPIs) for the specified timeframe and tenant.
    /// </summary>
    Task<KpiDto> GetKpisAsync(Timeframe timeframe, Guid? tenantId = null);

    /// <summary>
    /// Retrieves revenue velocity points for the specified timeframe.
    /// </summary>
    Task<IReadOnlyList<VelocityPointDto>> GetVelocityAsync(Timeframe timeframe, Guid? tenantId = null);

    /// <summary>
    /// Retrieves running accumulated revenue for current and previous periods.
    /// </summary>
    Task<IReadOnlyList<AccumulatedRevenuePointDto>> GetAccumulatedRevenueAsync(Timeframe timeframe, Guid? tenantId = null);

    /// <summary>
    /// Identifies tenants with the most extreme growth.
    /// </summary>
    Task<IReadOnlyList<GrowthExtremeDto>> GetGrowthExtremesAsync(Timeframe timeframe);

    /// <summary>
    /// Analyzes revenue efficiency across all tenants, returning AOV, portfolio share, and growth velocity.
    /// </summary>
    Task<RevenueEfficiencyDto> GetRevenueEfficiencyAsync(Timeframe timeframe);

    /// <summary>
    /// Analyzes order volume anomalies by comparing current volume against a baseline period.
    /// </summary>
    Task<IReadOnlyList<VolumeAnomalyDto>> GetVolumeAnomalyAsync(Timeframe timeframe);

    /// <summary>
    /// Analyzes revenue momentum across all tenants.
    /// </summary>
    Task<MomentumDto> GetMomentumAsync(Timeframe timeframe);

    /// <summary>
    /// Calculates net growth addition (revenue delta) for a specific tenant.
    /// </summary>
    Task<IReadOnlyList<NetGrowthAdditionPointDto>> GetNetGrowthAdditionAsync(Timeframe timeframe, Guid tenantId);

    /// <summary>
    /// Generates a distribution histogram of order values for a specific tenant.
    /// </summary>
    Task<IReadOnlyList<OrderBinDto>> GetOrderDistributionAsync(Timeframe timeframe, Guid tenantId, int? binCount = null);

    /// <summary>
    /// Analyzes transaction density by day of week and hour of day.
    /// </summary>
    Task<IReadOnlyList<TransactionDensityPointDto>> GetTransactionDensityAsync(Timeframe timeframe, Guid? tenantId = null);

    /// <summary>
    /// Calculates the cumulative growth delta for the specified timeframe.
    /// </summary>
    Task<IReadOnlyList<CumulativeGrowthDeltaPointDto>> GetCumulativeGrowthDeltaAsync(Timeframe timeframe, Guid? tenantId = null);
}


