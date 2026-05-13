namespace Api.DTOs.Tenants;

public class UpdateTenantRequestDto
{
    public string? Name { get; set; }
    public string? LitiumBaseUrl { get; set; }
    public string? ServiceAccountToken { get; set; }
    public bool? OrderFetchingEnabled { get; set; }
}