namespace Api.DTOs.Financial;

public class VolumeAnomalyResponseDto
{
    public Guid TenantId { get; set; }
    public string TenantName { get; set; } = string.Empty;
    public decimal VolumeDeviationPercentage { get; set; }
    public int CurrentVolume { get; set; }
    public decimal BaselineVolume { get; set; }
}
