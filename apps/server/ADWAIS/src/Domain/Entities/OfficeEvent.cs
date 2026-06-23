using System;

namespace Adwais.Domain.Entities;

public class OfficeEvent
{
    public Guid Id { get; set; }
    public required string Title { get; set; }
    public string? Description { get; set; }
    public string? Location { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public required string EventType { get; set; }
    public bool IsImportant { get; set; }
    public bool IsRecurring { get; set; }
    public bool IsSpecial { get; set; }
    public required string Recurrence { get; set; }
    public Guid? UserId { get; set; }
    public User? User { get; set; }
}
