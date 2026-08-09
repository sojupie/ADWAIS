namespace Adwais.Api.DTOs.Intranet;

public record BulletinPostResponseDto(
    Guid Id,
    string Title,
    string Body,
    DateTime CreatedAt,
    DateTime? UpdatedAt,
    BulletinPostAuthorDto? Author
);
