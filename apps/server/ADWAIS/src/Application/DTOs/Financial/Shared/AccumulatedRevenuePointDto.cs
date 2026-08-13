// Part of the ADWAIS project, under the Business Source License 1.1.
// See /LICENSE for license information.
// SPDX-License-Identifier: BUSL-1.1

namespace Adwais.Application.DTOs.Financial;

public record AccumulatedRevenuePointDto(
    DateTimeOffset Timestamp,
    decimal CurrentRevenue,
    decimal CurrentRevenueB2C,
    decimal CurrentRevenueB2B,
    decimal CurrentRevenueMixed,
    decimal PreviousRevenue,
    decimal CurrentAccumulated,
    decimal PreviousAccumulated);


