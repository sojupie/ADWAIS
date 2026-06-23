namespace Adwais.Domain.Entities.Intranet;

public class FeedSource
{
    public Guid Id { get; set; }
    public required string Name { get; set; }
    public required string Url { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime? LastPolledAt { get; set; }
    public ICollection<FeedItem> FeedItems { get; set; } = new List<FeedItem>();
}
