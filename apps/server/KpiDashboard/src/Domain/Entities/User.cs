using Domain.Entities.Office.Enums;

namespace Domain.Entities;

public class User
{
    public Guid Id { get; set; }
    public required string Name { get; set; }
    public UserRole Role { get; set; }
}
