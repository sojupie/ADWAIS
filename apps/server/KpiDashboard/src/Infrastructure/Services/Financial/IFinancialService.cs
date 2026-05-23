using Domain.DTOs.Financial;
using Domain.Enums;

namespace Infrastructure.Services.Financial;

public interface IFinancialService
{
    /// <summary>
    /// Calculates key performance indicators (KPIs) for the specified timeframe and tenant.
    /// </summary>
    /// <param name="timeframe">The timeframe to calculate KPIs for.</param>
    /// <param name="tenantId">Optional tenant ID to filter results. If null, global data is used.</param>
    /// <returns>A DTO containing revenue, previous revenue, growth percentage, volume, and average order value.</returns>
    Task<KpiDto> GetKpisAsync(Timeframe timeframe, Guid? tenantId = null);

    /// <summary>
    /// Retrieves daily revenue velocity points for the specified timeframe.
    /// </summary>
    /// <param name="timeframe">The timeframe to retrieve velocity for.</param>
    /// <param name="tenantId">Optional tenant ID to filter results. If null, global data is used.</param>
    /// <returns>A list of velocity points, each representing a day's revenue compared to the previous period.</returns>
    Task<IReadOnlyList<VelocityPointDto>> GetVelocityAsync(Timeframe timeframe, Guid? tenantId = null);

    /// <summary>
    /// Identifies tenants with the most extreme growth (highest and lowest) during the specified timeframe.
    /// </summary>
    /// <param name="timeframe">The timeframe to analyze growth extremes.</param>
    /// <returns>A list of growth extreme DTOs containing tenant growth metrics.</returns>
    Task<IReadOnlyList<GrowthExtremeDto>> GetGrowthExtremesAsync(Timeframe timeframe);

    /// <summary>
    /// Calculates the distribution of revenue across top tenants for the specified timeframe.
    /// </summary>
    /// <param name="timeframe">The timeframe to calculate distribution for.</param>
    /// <param name="topN">The number of top tenants to include before grouping others.</param>
    /// <returns>A list of distribution entries representing tenant revenue shares.</returns>
    Task<IReadOnlyList<DistributionEntryDto>> GetDistributionAsync(Timeframe timeframe, int topN = 10);

    /// <summary>
    /// Analyzes revenue momentum across all tenants for the specified timeframe.
    /// </summary>
    /// <param name="timeframe">The timeframe to analyze momentum.</param>
    /// <returns>A momentum DTO containing median growth and individual tenant momentum data.</returns>
    Task<MomentumDto> GetMomentumAsync(Timeframe timeframe);

    /// <summary>
    /// Calculates daily net growth addition (revenue delta) for a specific tenant.
    /// </summary>
    /// <param name="timeframe">The timeframe to calculate growth addition for.</param>
    /// <param name="tenantId">The specific tenant ID.</param>
    /// <returns>A list of points representing daily revenue changes.</returns>
    Task<IReadOnlyList<NetGrowthAdditionPointDto>> GetNetGrowthAdditionAsync(Timeframe timeframe, Guid tenantId);

    /// <summary>
    /// Generates a distribution histogram of order values for a specific tenant.
    /// </summary>
    /// <param name="timeframe">The timeframe to analyze orders.</param>
    /// <param name="tenantId">The specific tenant ID.</param>
    /// <param name="binCount">Optional number of bins for the histogram. If null, an adaptive count is calculated.</param>
    /// <returns>A list of bins representing the order value distribution.</returns>
    Task<IReadOnlyList<OrderBinDto>> GetOrderDistributionAsync(Timeframe timeframe, Guid tenantId, int? binCount = null);

    /// <summary>
    /// Analyzes transaction density by day of week and hour of day.
    /// </summary>
    /// <param name="timeframe">The timeframe to analyze density.</param>
    /// <param name="tenantId">Optional tenant ID to filter results. If null, global data is used.</param>
    /// <returns>A list of density points for every hour of the week (168 points).</returns>
    Task<IReadOnlyList<TransactionDensityPointDto>> GetTransactionDensityAsync(Timeframe timeframe, Guid? tenantId = null);
}
