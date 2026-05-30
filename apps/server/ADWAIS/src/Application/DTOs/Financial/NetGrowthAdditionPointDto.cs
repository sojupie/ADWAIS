namespace Adwais.Application.DTOs.Financial;

public record NetGrowthAdditionPointDto(
    string Label,
    DateTimeOffset Timestamp,
    decimal NetGrowthAddition);


