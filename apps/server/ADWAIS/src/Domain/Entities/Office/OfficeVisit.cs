namespace Adwais.Domain.Entities.Office;

public class OfficeVisit
{
    public Guid Id { get; set; }
    public required string GuestName { get; set; }
    public string? Company { get; set; }
    public string? LogoUrl { get; set; }
    public DateTimeOffset VisitTime { get; set; }
    public Guid? CreatedByUserId { get; set; }
    public User? CreatedBy { get; set; }
}


