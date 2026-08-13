// Part of the ADWAIS project, under the Business Source License 1.1.
// See /LICENSE for license information.
// SPDX-License-Identifier: BUSL-1.1

using Adwais.Domain.Enums;

namespace Adwais.Application.DTOs.Financial;

public record RevenueEfficiencyTenantDto(
    Guid TenantId,
    string TenantName,
    TenantType Type,
    decimal AverageOrderValue,
    decimal OrderVolume,
    decimal PortfolioSharePercentage,
    decimal GrowthVelocity,
    string? OrderProviderEndpoint
);

public record RevenueEfficiencyDto(
    decimal GlobalAverageOrderValue,
    decimal MedianOrderVolume,
    decimal MedianPortfolioShare,
    IReadOnlyList<RevenueEfficiencyTenantDto> Tenants
);


