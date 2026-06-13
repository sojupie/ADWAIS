namespace Adwais.Api.DTOs.Financial;

public record VolumeAnomalyResponseDto
{
    public Guid TenantId { get; init; }
    public string TenantName { get; init; } = string.Empty;
    public decimal VolumeDeviationPercentage { get; init; }
    public int CurrentVolume { get; init; }
    public decimal BaselineVolume { get; init; }
}


