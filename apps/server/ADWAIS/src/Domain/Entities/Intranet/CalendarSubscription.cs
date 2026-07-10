using System;
using System.Collections.Generic;

namespace Adwais.Domain.Entities.Intranet;

public class CalendarSubscription
{
    public Guid Id { get; set; }
    public required string Name { get; set; }
    public required string Url { get; set; }
    public bool IsActive { get; set; }
    public DateTimeOffset? LastPolledAt { get; set; }
    public DateTimeOffset? LastSuccessAt { get; set; }
    public string? LastSyncError { get; set; }
    public ICollection<OfficeEvent> Events { get; set; } = new List<OfficeEvent>();
}
