using System.ComponentModel.DataAnnotations;

namespace Api.DTOs.Ingestion;

/// <summary>
/// Request DTO for triggering a historical order backfill for a tenant.
/// </summary>
public class HistoricalBackfillRequestDto
{
    /// <summary>
    /// The unique identifier of the tenant.
    /// </summary>
    [Required]
    public Guid TenantId { get; set; }

    /// <summary>
    /// The start date for the backfill window. 
    /// Defaults to 2 years ago if not provided.
    /// </summary>
    public DateTimeOffset StartDate { get; set; } = DateTimeOffset.UtcNow.AddYears(-2);

    /// <summary>
    /// The end date for the backfill window.
    /// Defaults to the current time if not provided.
    /// </summary>
    public DateTimeOffset EndDate { get; set; } = DateTimeOffset.UtcNow;
}