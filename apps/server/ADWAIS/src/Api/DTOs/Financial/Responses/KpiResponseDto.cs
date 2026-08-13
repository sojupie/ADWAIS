// Part of the ADWAIS project, under the Business Source License 1.1.
// See /LICENSE for license information.
// SPDX-License-Identifier: BUSL-1.1

namespace Adwais.Api.DTOs.Financial;

public record KpiResponseDto(
    decimal CurrentRevenue,
    decimal PreviousRevenue,
    decimal RevenueGrowthPercentage,
    int TransactionVolume,
    decimal VolumeGrowthPercentage,
    decimal AverageOrderValue,
    decimal AovGrowthPercentage,
    int ActiveTenants,
    decimal ActiveTenantsGrowthPercentage,
    decimal AverageRevenuePerTenant,
    decimal ArptGrowthPercentage);


