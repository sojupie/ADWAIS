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
            Timeframe.Today => BuildRollingHourlyPeriod(currentEnd, now, 1, comparisonType),
            Timeframe.T7 => BuildRollingHourlyPeriod(currentEnd, now, 7, comparisonType),
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
    private static ResolvedPeriod BuildFixedPeriod(DateTimeOffset today, DateTimeOffset currentEnd, int days, ComparisonType comparisonType, bool isHourly = false)
    {
        var currentStart = today.AddDays(-(days - 1));
        var previousStart = comparisonType == ComparisonType.YearOverYear
            ? today.AddYears(-1).AddDays(-(days - 1))
            : currentStart.AddDays(-days);
        var previousEnd = previousStart + (currentEnd - currentStart);
        
        var steps = isHourly ? 48 : days;
        if (isHourly && steps == 0) steps = 1;

        return new ResolvedPeriod(currentStart, currentEnd, previousStart, previousEnd, steps, isHourly, false);
    }

    /// <summary>
    /// Builds a rolling hourly period and its previous comparison period.
    /// </summary>
    private static ResolvedPeriod BuildRollingHourlyPeriod(DateTimeOffset currentEnd, DateTimeOffset now, int days, ComparisonType comparisonType)
    {
        var currentHour = new DateTimeOffset(now.Year, now.Month, now.Day, now.Hour, 0, 0, TimeSpan.Zero);
        var hoursToSubtract = (days * 24) - 1;
        var currentStart = currentHour.AddHours(-hoursToSubtract);
        
        var previousStart = comparisonType == ComparisonType.YearOverYear
            ? currentStart.AddYears(-1)
            : currentStart.AddDays(-days);
            
        var previousEnd = previousStart + (currentEnd - currentStart);
        
        var steps = days == 7 ? 42 : 48;
        return new ResolvedPeriod(currentStart, currentEnd, previousStart, previousEnd, steps, true, days == 1);
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
