namespace Domain.DTOs.Financial;

public record KpiDto(
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
