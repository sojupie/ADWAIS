using Domain.DTOs.Financial;
using Domain.Enums;

namespace Domain.Services;

public interface IFinancialService
{
    Task<KpiDto> GetKpisAsync(Timeframe timeframe, Guid? tenantId = null);
    Task<IReadOnlyList<VelocityPointDto>> GetVelocityAsync(Timeframe timeframe, Guid? tenantId = null);
    Task<IReadOnlyList<GrowthExtremeDto>> GetGrowthExtremesAsync(Timeframe timeframe);
    Task<IReadOnlyList<DistributionEntryDto>> GetDistributionAsync(Timeframe timeframe, int topN = 10);
    Task<MomentumDto> GetMomentumAsync(Timeframe timeframe);
    Task<IReadOnlyList<CumulativeGrowthPointDto>> GetCumulativeGrowthAsync(Timeframe timeframe, Guid tenantId);
    Task<IReadOnlyList<OrderBinDto>> GetOrderDistributionAsync(Timeframe timeframe, Guid tenantId, int? binCount = null);
}
