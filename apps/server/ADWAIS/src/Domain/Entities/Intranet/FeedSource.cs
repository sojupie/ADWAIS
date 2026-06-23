using System;
using System.Collections.Generic;

namespace Adwais.Domain.Entities;

public class FeedSource
{
    public Guid Id { get; set; }
    public required string Name { get; set; }
    public required string Url { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime? LastPolledAt { get; set; }
    public ICollection<FeedItem> FeedItems { get; set; } = new List<FeedItem>();
}
