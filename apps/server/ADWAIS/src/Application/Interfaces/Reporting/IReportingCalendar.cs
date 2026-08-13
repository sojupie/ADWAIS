// Part of the ADWAIS project, under the Business Source License 1.1.
// See /LICENSE for license information.
// SPDX-License-Identifier: BUSL-1.1

using Adwais.Application.Common.Models;
using Adwais.Domain.Enums;

namespace Adwais.Application.Interfaces;

/// <summary>
/// Provides the configured business-reporting calendar used to turn local
/// calendar boundaries into UTC instants for storage and querying.
/// </summary>
public interface IReportingCalendar
{
    Task<TimeZoneInfo> GetTimeZoneAsync(CancellationToken ct = default);

    Task<ResolvedPeriod> ResolvePeriodAsync(
        Timeframe timeframe,
        ComparisonType comparisonType = ComparisonType.Preceding,
        CancellationToken ct = default);

    DateTimeOffset GetStartOfDayUtc(DateTimeOffset instant, TimeZoneInfo timeZone);
}
