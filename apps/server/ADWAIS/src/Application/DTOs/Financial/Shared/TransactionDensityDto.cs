// Part of the ADWAIS project, under the Business Source License 1.1.
// See /LICENSE for license information.
// SPDX-License-Identifier: BUSL-1.1

using Adwais.Domain.Enums;

namespace Adwais.Application.DTOs.Financial;

public record TransactionDensityDto(
    int TotalCount,
    int MinCount,
    int MaxCount,
    double AverageCountPerBucket,
    TransactionDensitySampleQuality SampleQuality,
    TransactionDensityPeriod RequestedPeriod,
    TransactionDensityPeriod EffectivePeriod,
    string TimeZoneId,
    DateTimeOffset PeriodStart,
    DateTimeOffset PeriodEnd,
    IReadOnlyList<TransactionDensityPointDto> Points);
