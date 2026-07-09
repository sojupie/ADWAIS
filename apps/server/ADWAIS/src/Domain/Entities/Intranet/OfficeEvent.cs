using Adwais.Domain.Enums;

namespace Adwais.Domain.Entities.Intranet;

public class OfficeEvent
{
    public Guid Id { get; set; }
    public required string Title { get; set; }
    public string? Description { get; set; }
    public string? Location { get; set; }
    public DateTimeOffset StartTime { get; set; }
    public DateTimeOffset EndTime { get; set; }
    public EventType EventType { get; set; }
    public bool IsImportant { get; set; }
    public bool IsRecurring { get; set; }
    public bool IsSpecial { get; set; }
    public RecurrenceType Recurrence { get; set; }
    public Guid? UserId { get; set; }
    public User? User { get; set; }
    public string? ExternalUid { get; set; }
    public Guid? CalendarSubscriptionId { get; set; }
    public CalendarSubscription? CalendarSubscription { get; set; }
}
