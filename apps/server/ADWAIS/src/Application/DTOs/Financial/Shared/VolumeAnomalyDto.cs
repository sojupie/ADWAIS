namespace Adwais.Application.DTOs.Financial;

public record VolumeAnomalyDto(
    Guid TenantId,
    string TenantName,
    decimal VolumeDeviationPercentage,
    int CurrentVolume,
    decimal BaselineVolume
);


