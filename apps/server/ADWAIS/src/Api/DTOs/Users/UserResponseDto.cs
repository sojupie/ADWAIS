using Adwais.Domain.Enums;

namespace Adwais.Api.DTOs.Users;

public record UserResponseDto(
    Guid Id,
    string Name,
    UserRole Role
);


