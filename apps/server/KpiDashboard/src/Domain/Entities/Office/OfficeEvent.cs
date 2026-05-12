using Domain.Enums;

namespace Domain.Entities.Office;

public class OfficeEvent
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Location { get; set; }
    public DateTimeOffset StartTime { get; set; }
    public DateTimeOffset? EndTime { get; set; }
    public EventType EventType { get; set; } = EventType.General;
    public bool IsImportant { get; set; }
    public bool IsRecurring { get; set; }
    public bool IsSpecial { get; set; }
    public RecurrenceType Recurrence { get; set; } = RecurrenceType.None;
    public Guid? CreatedByUserId { get; set; }
    public User? CreatedBy { get; set; }
}