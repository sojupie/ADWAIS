namespace Domain.DTOs.Financial;

public record NetGrowthAdditionPointDto(
    string PeriodLabel,
    decimal NetGrowthAddition);
