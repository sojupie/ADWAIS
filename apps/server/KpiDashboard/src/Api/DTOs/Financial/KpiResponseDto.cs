namespace Api.DTOs.Financial;

public record KpiResponseDto(
    decimal CurrentRevenue,
    decimal PreviousRevenue,
    decimal RevenueGrowthPercentage,
    int TransactionVolume,
    decimal AverageOrderValue);
