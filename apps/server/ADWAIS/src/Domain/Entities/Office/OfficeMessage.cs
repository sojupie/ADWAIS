namespace Adwais.Domain.Entities.Office;

public class OfficeMessage
{
    public Guid Id { get; set; }
    public required string Content { get; set; }
    public DateTimeOffset ValidFrom { get; set; }
    public DateTimeOffset ValidUntil { get; set; }
    public Guid? CreatedByUserId { get; set; }
    public User? CreatedBy { get; set; }
}


