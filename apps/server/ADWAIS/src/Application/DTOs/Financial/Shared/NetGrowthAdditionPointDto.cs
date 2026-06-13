namespace Adwais.Application.DTOs.Financial;

public record NetGrowthAdditionPointDto(
    DateTimeOffset Timestamp,
    decimal NetGrowthAddition);


