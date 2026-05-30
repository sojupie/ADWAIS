using Adwais.Domain.Entities.Office.Enums;

namespace Adwais.Api.DTOs.Users;

public record UpdateUserRequestDto(
    string? Name = null,
    UserRole? Role = null
);


