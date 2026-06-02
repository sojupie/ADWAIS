using Adwais.Domain.Entities;
namespace Adwais.Api.DTOs.Ingestion;

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
    /// The start date for the backfill operation. If null, the DefaultLookBackPeriodYears is used to calculate the start date.
    /// </summary>
    public DateTimeOffset? StartDate { get; set; }

    /// <summary>
    /// The end date for the backfill operation. If null, the current time is used.
    /// </summary>
    public DateTimeOffset? EndDate { get; set; }
    
    /// <summary>
    /// The lookback period in years for the backfill operation. Defaults to 2.
    /// </summary>
    internal int DefaultLookBackPeriodYears { get; set; } = 2;
}


