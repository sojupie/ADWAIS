using Domain.Enums;

namespace Api.DTOs.Tenants;

public class CreateTenantRequestDto
{
    public string Name { get; set; } = string.Empty;
    public TenantType Type { get; set; } = TenantType.Mixed;
    public string LitiumBaseUrl { get; set; } = string.Empty;
    public string ServiceAccountToken { get; set; } = string.Empty;
    public bool OrderFetchingEnabled { get; set; } = false;
}