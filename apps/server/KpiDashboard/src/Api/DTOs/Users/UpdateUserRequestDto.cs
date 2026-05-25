using Domain.Entities.Office.Enums;

namespace Api.DTOs.Users;

public record UpdateUserRequestDto(
    string? Name = null,
    UserRole? Role = null
);
