namespace Adwais.Api.DTOs.Financial;

public record KpiResponseDto(
    decimal CurrentRevenue,
    decimal PreviousRevenue,
    decimal RevenueGrowthPercentage,
    int TransactionVolume,
    decimal VolumeGrowthPercentage,
    decimal AverageOrderValue,
    decimal AovGrowthPercentage,
    int ActiveTenants,
    decimal ActiveTenantsGrowthPercentage,
    decimal AverageRevenuePerTenant,
    decimal ArptGrowthPercentage);


