// Part of the ADWAIS project, under the Business Source License 1.1.
// See /LICENSE for license information.
// SPDX-License-Identifier: BUSL-1.1

using System.ComponentModel.DataAnnotations;

namespace Adwais.Api.DTOs.Financial;

public record TransactionDensityPointResponseDto(
    [property: Required] int DayOfWeek,
    [property: Required] int Hour,
    [property: Required] int Count,
    [property: Required] decimal TotalRevenue);


