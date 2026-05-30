namespace Adwais.Domain.DTOs.Financial;

public record NetGrowthAdditionPointDto(
    string Label,
    DateTimeOffset Timestamp,
    decimal NetGrowthAddition);


