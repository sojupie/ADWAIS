using System.ComponentModel.DataAnnotations;
using Adwais.Domain.Enums;

namespace Adwais.Domain.Entities;

public class User
{
    public Guid Id { get; set; }
    public Guid? EntraObjectId { get; set; }
    public string? Email { get; set; } 
    public required string Name { get; set; }
    public required UserRole Role { get; set; }
}


