// Part of the ADWAIS project, under the Business Source License 1.1.
// See /LICENSE for license information.
// SPDX-License-Identifier: BUSL-1.1

using System.ComponentModel.DataAnnotations;
using Adwais.Domain.Enums;

namespace Adwais.Api.DTOs.Financial;

public record TransactionDensityResponseDto(
    [property: Required] int TotalCount,
    [property: Required] int MinCount,
    [property: Required] int MaxCount,
    [property: Required] double AverageCountPerBucket,
    [property: Required] TransactionDensitySampleQuality SampleQuality,
    [property: Required] TransactionDensityPeriod RequestedPeriod,
    [property: Required] TransactionDensityPeriod EffectivePeriod,
    [property: Required] string TimeZoneId,
    [property: Required] DateTimeOffset PeriodStart,
    [property: Required] DateTimeOffset PeriodEnd,
    [property: Required] IReadOnlyList<TransactionDensityPointResponseDto> Points);
