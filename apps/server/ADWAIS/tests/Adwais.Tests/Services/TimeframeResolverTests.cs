using Adwais.Application.Services;
using Adwais.Domain.Enums;
using Xunit;

namespace Adwais.Tests.Services;

public class TimeframeResolverTests
{
    [Fact]
    public void Resolve_FixedPeriod_UsesReportingTimeZoneMidnight()
    {
        var stockholm = TimeZoneInfo.FindSystemTimeZoneById("Europe/Stockholm");
        var now = new DateTimeOffset(2026, 7, 19, 12, 0, 0, TimeSpan.Zero);

        var period = TimeframeResolver.Resolve(
            Timeframe.T30,
            ComparisonType.Preceding,
            stockholm,
            now);

        Assert.Equal(
            new DateTimeOffset(2026, 6, 19, 22, 0, 0, TimeSpan.Zero),
            period.CurrentStart);
        Assert.Equal(now, period.CurrentEnd);
    }
}
