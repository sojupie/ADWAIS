using Domain.Entities.Office.Enums;

namespace Api.DTOs.Users;

public record UserResponseDto(
    Guid Id,
    string Name,
    UserRole Role
);
