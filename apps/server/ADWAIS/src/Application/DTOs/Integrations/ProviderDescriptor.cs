// Part of the ADWAIS project, under the Business Source License 1.1.
// See /LICENSE for license information.
// SPDX-License-Identifier: BUSL-1.1

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
