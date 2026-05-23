namespace Api.DTOs.Financial;

public record NetGrowthAdditionPointResponseDto(
    string PeriodLabel,
    decimal NetGrowthAddition);
