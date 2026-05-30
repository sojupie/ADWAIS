namespace Adwais.Domain.Entities;

public enum SystemEventLevel
{
    Information,
    Warning,
    Error,
    Critical
}

public class SystemEvent
{
    public Guid Id { get; set; }
    public DateTimeOffset Timestamp { get; set; } = DateTimeOffset.UtcNow;
    public SystemEventLevel Level { get; set; }
    public required string Source { get; set; }
    public required string Message { get; set; }
    public string? Details { get; set; }
    public TenantId? TenantId { get; set; }
    public Tenant? Tenant { get; set; }
}

