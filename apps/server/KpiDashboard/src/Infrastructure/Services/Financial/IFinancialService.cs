using Domain.DTOs.Financial;
using Domain.Enums;

namespace Infrastructure.Services.Financial;

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
    /// Identifies tenants with the most extreme growth.
    /// </summary>
    Task<IReadOnlyList<GrowthExtremeDto>> GetGrowthExtremesAsync(Timeframe timeframe);

    /// <summary>
    /// Calculates the distribution of revenue across top tenants.
    /// </summary>
    Task<IReadOnlyList<DistributionEntryDto>> GetDistributionAsync(Timeframe timeframe, int topN = 10);

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
