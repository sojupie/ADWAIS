// Part of the ADWAIS project, under the Business Source License 1.1.
// See /LICENSE for license information.
// SPDX-License-Identifier: BUSL-1.1

namespace Adwais.Application.DTOs.Financial;

public record TransactionDensityPointDto(
    int DayOfWeek, // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    int Hour,      // 0-23
    int Count,
    decimal TotalRevenue);


