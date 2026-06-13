using Adwais.Domain.Enums;

namespace Adwais.Api.DTOs.Users;

public record UpdateUserRequestDto(
    string? Name = null,
    UserRole? Role = null
);


