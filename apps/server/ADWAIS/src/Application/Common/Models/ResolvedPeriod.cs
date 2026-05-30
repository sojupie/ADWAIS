using System;

namespace Adwais.Application.Common.Models;

public record ResolvedPeriod
{
    public DateTimeOffset CurrentStart { get; }
    public DateTimeOffset CurrentEnd { get; }
    public DateTimeOffset PreviousStart { get; }
    public int StepsInPeriod { get; }
    public bool IsHourly { get; }
    public bool IncludeActualTime { get; }

    public ResolvedPeriod(
        DateTimeOffset currentStart,
        DateTimeOffset currentEnd,
        DateTimeOffset previousStart,
        int stepsInPeriod,
        bool isHourly,
        bool includeActualTime)
    {
        if (currentStart >= currentEnd)
            throw new ArgumentException("Period start must be before end.");
        if (previousStart >= currentStart)
            throw new ArgumentException("Previous period must start before current period.");

        CurrentStart = currentStart;
        CurrentEnd = currentEnd;
        PreviousStart = previousStart;
        StepsInPeriod = stepsInPeriod;
        IsHourly = isHourly;
        IncludeActualTime = includeActualTime;
    }
}
