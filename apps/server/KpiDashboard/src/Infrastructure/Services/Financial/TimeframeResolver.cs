using Domain.Enums;

namespace Infrastructure.Services.Financial;

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
    public static (DateTimeOffset CurrentStart, DateTimeOffset CurrentEnd, DateTimeOffset PreviousStart, int StepsInPeriod, bool IsHourly, bool IncludeActualTime) Resolve(Timeframe timeframe)
    {
        var now = DateTimeOffset.UtcNow;
        var today = new DateTimeOffset(now.Year, now.Month, now.Day, 0, 0, 0, TimeSpan.Zero);
        var tomorrow = today.AddDays(1);
        var currentEnd = now;

        return timeframe switch
        {
            Timeframe.Today => (today, currentEnd, today.AddDays(-1), now.Hour + 1, true, true),
            Timeframe.T7 => BuildFixedPeriod(today, currentEnd, 7),
            Timeframe.T30 => BuildFixedPeriod(today, currentEnd, 30),
            Timeframe.T90 => BuildFixedPeriod(today, currentEnd, 90),
            Timeframe.Ytd => BuildYtdPeriod(today, tomorrow, currentEnd),
            Timeframe.T365 => BuildFixedPeriod(today, currentEnd, 365),
            _ => BuildFixedPeriod(today, currentEnd, 30)
        };
    }

    /// <summary>
    /// Builds a fixed-length period (e.g., trailing 30 days) and its previous comparison period.
    /// </summary>
    private static (DateTimeOffset, DateTimeOffset, DateTimeOffset, int, bool, bool) BuildFixedPeriod(DateTimeOffset today, DateTimeOffset currentEnd, int days)
    {
        var currentStart = today.AddDays(-(days - 1));
        var previousStart = currentStart.AddDays(-days);
        return (currentStart, currentEnd, previousStart, days, false, false);
    }

    /// <summary>
    /// Builds a Year-to-Date (YTD) period and an equivalent-length comparison period.
    /// </summary>
    private static (DateTimeOffset, DateTimeOffset, DateTimeOffset, int, bool, bool) BuildYtdPeriod(DateTimeOffset today, DateTimeOffset tomorrow, DateTimeOffset currentEnd)
    {
        var currentStart = new DateTimeOffset(today.Year, 1, 1, 0, 0, 0, TimeSpan.Zero);
        var daysInPeriod = (tomorrow - currentStart).Days;
        
        var previousStart = currentStart.AddDays(-daysInPeriod);
        return (currentStart, currentEnd, previousStart, daysInPeriod, false, false);
    }
}
