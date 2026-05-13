using Domain.Enums;

namespace Domain.Entities.Office;

public class OfficeEvent
{
    public Guid Id { get; set; }
    public required string Title { get; set; }
    public string? Description { get; set; }
    public string? Location { get; set; }
    public DateTimeOffset? StartTime { get; set; }
    public DateTimeOffset? EndTime { get; set; }
    public EventType EventType { get; set; }
    public bool IsImportant { get; set; }
    public bool IsRecurring { get; set; }
    public bool IsSpecial { get; set; }
    public RecurrenceType Recurrence { get; set; }
    public Guid? CreatedByUserId { get; set; }
    public User? CreatedBy { get; set; }
}
