namespace Adwais.Application.Interfaces;

/// <summary>
/// Rebuilds materialized rollups whose calendar-day grouping depends on the
/// configured reporting timezone.
/// </summary>
public interface IReportingRollupRefresher
{
    Task RefreshAsync(CancellationToken ct = default);
}
