using Adwais.Domain.Enums;

namespace Adwais.Api.DTOs.Users;

public record CreateUserRequestDto(
    string Name,
    UserRole Role
);


