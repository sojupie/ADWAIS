// Part of the ADWAIS project, under the Business Source License 1.1.
// See /LICENSE for license information.
// SPDX-License-Identifier: BUSL-1.1

namespace Adwais.Api.DTOs.Financial;

public record OrderBinResponseDto(
    string BinLabel,
    decimal MinValue,
    decimal MaxValue,
    int OrderCount,
    decimal CumulativePercentage,
    decimal KdeDensity);


