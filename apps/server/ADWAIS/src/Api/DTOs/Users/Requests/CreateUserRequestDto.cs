using Adwais.Domain.Enums;

namespace Adwais.Api.DTOs.Users;

public record CreateUserRequestDto(
    string Email,
    UserRole Role
);


