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
    public static (DateTime CurrentStart, DateTime CurrentEnd, DateTime PreviousStart, int DaysInPeriod) Resolve(Timeframe timeframe)
    {
        var today = DateTime.UtcNow.Date;
        var currentEnd = today.AddDays(1); // exclusive upper bound (includes all of today)

        return timeframe switch
        {
            Timeframe.T7 => BuildFixedPeriod(today, currentEnd, 7),
            Timeframe.T30 => BuildFixedPeriod(today, currentEnd, 30),
            Timeframe.T90 => BuildFixedPeriod(today, currentEnd, 90),
            Timeframe.YTD => BuildYtdPeriod(today, currentEnd),
            _ => BuildFixedPeriod(today, currentEnd, 30)
        };
    }

    private static (DateTime, DateTime, DateTime, int) BuildFixedPeriod(DateTime today, DateTime currentEnd, int days)
    {
        // Current period: [today - (days-1), tomorrow)  →  includes today as the last day
        var currentStart = today.AddDays(-(days - 1));
        var previousStart = currentStart.AddDays(-days);
        return (currentStart, currentEnd, previousStart, days);
    }

    private static (DateTime, DateTime, DateTime, int) BuildYtdPeriod(DateTime today, DateTime currentEnd)
    {
        // Current period: [Jan 1 this year, tomorrow)
        var currentStart = new DateTime(today.Year, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        var daysInPeriod = (currentEnd - currentStart).Days;

        // Previous period: same number of days ending at Jan 1 this year
        var previousStart = currentStart.AddDays(-daysInPeriod);
        return (currentStart, currentEnd, previousStart, daysInPeriod);
    }
}
