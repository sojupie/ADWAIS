using Adwais.Application.Common.Models;
using Adwais.Domain.Enums;

namespace Adwais.Application.Services;

/// <summary>
/// Converts a <see cref="Timeframe"/> enum into concrete UTC date boundaries
/// for the current period and its immediately preceding comparison period.
/// </summary>
public static class TimeframeResolver
{
    /// <summary>
    /// Resolves the current and previous period date ranges for a given timeframe.
    /// All dates are UTC midnight-aligned.
    /// </summary>
    public static ResolvedPeriod Resolve(Timeframe timeframe, ComparisonType comparisonType = ComparisonType.Preceding)
    {
        var now = DateTimeOffset.UtcNow;
        var today = new DateTimeOffset(now.Year, now.Month, now.Day, 0, 0, 0, TimeSpan.Zero);
        var tomorrow = today.AddDays(1);
        var currentEnd = now;

        return timeframe switch
        {
            Timeframe.Today => new ResolvedPeriod(today, currentEnd, today.AddDays(-1), today.AddDays(-1) + (currentEnd - today), now.Hour + 1, true, true),
            Timeframe.T7 => BuildFixedPeriod(today, currentEnd, 7, comparisonType),
            Timeframe.T30 => BuildFixedPeriod(today, currentEnd, 30, comparisonType),
            Timeframe.T90 => BuildFixedPeriod(today, currentEnd, 90, comparisonType),
            Timeframe.Ytd => BuildYtdPeriod(today, tomorrow, currentEnd, comparisonType),
            Timeframe.T365 => BuildFixedPeriod(today, currentEnd, 365, comparisonType),
            _ => BuildFixedPeriod(today, currentEnd, 30, comparisonType)
        };
    }

    /// <summary>
    /// Builds a fixed-length period (e.g., trailing 30 days) and its previous comparison period.
    /// </summary>
    private static ResolvedPeriod BuildFixedPeriod(DateTimeOffset today, DateTimeOffset currentEnd, int days, ComparisonType comparisonType)
    {
        var currentStart = today.AddDays(-(days - 1));
        var previousStart = comparisonType == ComparisonType.YearOverYear
            ? today.AddYears(-1).AddDays(-(days - 1))
            : currentStart.AddDays(-days);
        var previousEnd = previousStart + (currentEnd - currentStart);
        return new ResolvedPeriod(currentStart, currentEnd, previousStart, previousEnd, days, false, false);
    }

    /// <summary>
    /// Builds a Year-to-Date (YTD) period and an equivalent-length comparison period.
    /// </summary>
    private static ResolvedPeriod BuildYtdPeriod(DateTimeOffset today, DateTimeOffset tomorrow, DateTimeOffset currentEnd, ComparisonType comparisonType)
    {
        var currentStart = new DateTimeOffset(today.Year, 1, 1, 0, 0, 0, TimeSpan.Zero);
        var daysInPeriod = (tomorrow - currentStart).Days;
        
        var previousStart = comparisonType == ComparisonType.YearOverYear
            ? currentStart.AddYears(-1)
            : currentStart.AddDays(-daysInPeriod);
        var previousEnd = previousStart + (currentEnd - currentStart);
        return new ResolvedPeriod(currentStart, currentEnd, previousStart, previousEnd, daysInPeriod, false, false);
    }
}
