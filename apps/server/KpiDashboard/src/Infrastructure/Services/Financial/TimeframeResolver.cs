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
        var currentEnd = today.AddDays(1);

        return timeframe switch
        {
            Timeframe.T7 => BuildFixedPeriod(today, currentEnd, 7),
            Timeframe.T30 => BuildFixedPeriod(today, currentEnd, 30),
            Timeframe.T90 => BuildFixedPeriod(today, currentEnd, 90),
            Timeframe.Ytd => BuildYtdPeriod(today, currentEnd),
            Timeframe.T365 => BuildFixedPeriod(today, currentEnd, 365),
            _ => BuildFixedPeriod(today, currentEnd, 30)
        };
    }

    /// <summary>
    /// Builds a fixed-length period (e.g., trailing 30 days) and its previous comparison period.
    /// </summary>
    private static (DateTime, DateTime, DateTime, int) BuildFixedPeriod(DateTime today, DateTime currentEnd, int days)
    {
        var currentStart = today.AddDays(-(days - 1));
        var previousStart = currentStart.AddDays(-days);
        return (currentStart, currentEnd, previousStart, days);
    }

    /// <summary>
    /// Builds a Year-to-Date (YTD) period and an equivalent-length comparison period.
    /// </summary>
    private static (DateTime, DateTime, DateTime, int) BuildYtdPeriod(DateTime today, DateTime currentEnd)
    {
        var currentStart = new DateTime(today.Year, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        var daysInPeriod = (currentEnd - currentStart).Days;
        
        var previousStart = currentStart.AddDays(-daysInPeriod);
        return (currentStart, currentEnd, previousStart, daysInPeriod);
    }
}
