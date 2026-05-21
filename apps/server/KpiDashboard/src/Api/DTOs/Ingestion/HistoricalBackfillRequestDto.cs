namespace Api.DTOs.Ingestion;

/// <summary>
/// Data transfer object for requesting a historical data backfill.
/// </summary>
public class HistoricalBackfillRequestDto
{
    /// <summary>
    /// The ID of the tenant for which to backfill data.
    /// </summary>
    public Guid TenantId { get; set; }

    /// <summary>
    /// The start date for the backfill operation. If null, a default lookback period is used.
    /// </summary>
    public DateTimeOffset? StartDate { get; set; }

    /// <summary>
    /// The end date for the backfill operation. If null, the current time is used.
    /// </summary>
    public DateTimeOffset? EndDate { get; set; }
}
