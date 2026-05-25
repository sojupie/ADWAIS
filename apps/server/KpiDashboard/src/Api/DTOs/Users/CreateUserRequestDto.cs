using Domain.Entities.Office.Enums;

namespace Api.DTOs.Users;

public record CreateUserRequestDto(
    string Name,
    UserRole Role
);
