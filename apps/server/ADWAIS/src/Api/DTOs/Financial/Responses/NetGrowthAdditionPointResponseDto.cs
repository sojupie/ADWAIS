namespace Adwais.Api.DTOs.Financial;

public record NetGrowthAdditionPointResponseDto(
    DateTimeOffset Timestamp,
    decimal NetGrowthAddition);


