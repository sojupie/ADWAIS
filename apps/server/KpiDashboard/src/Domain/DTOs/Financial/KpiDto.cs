namespace Domain.DTOs.Financial;

public record KpiDto(
    decimal CurrentRevenue,
    decimal PreviousRevenue,
    decimal RevenueGrowthPercentage,
    int TransactionVolume,
    decimal AverageOrderValue);
