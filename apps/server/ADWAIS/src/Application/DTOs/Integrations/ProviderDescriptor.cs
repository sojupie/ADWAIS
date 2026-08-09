namespace Adwais.Application.DTOs.Integrations;

public sealed record ProviderDescriptor(
    string Id,
    string DisplayName,
    IReadOnlyList<ProviderSettingDescriptor> Settings);

public sealed record ProviderSettingDescriptor(
    string Key,
    string Label,
    string InputType,
    bool Required,
    string? Placeholder = null);
