namespace Adwais.Api.DTOs.Financial;

public record NetGrowthAdditionPointResponseDto(
    string Label,
    DateTimeOffset Timestamp,
    decimal NetGrowthAddition);


