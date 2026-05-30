namespace Adwais.Domain.DTOs.Financial;

public record VolumeAnomalyDto(
    Guid TenantId,
    string TenantName,
    decimal VolumeDeviationPercentage,
    int CurrentVolume,
    decimal BaselineVolume
);


