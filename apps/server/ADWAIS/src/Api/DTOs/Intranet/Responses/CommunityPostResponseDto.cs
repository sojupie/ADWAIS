namespace Adwais.Api.DTOs.Intranet;

public record CommunityPostResponseDto(
    Guid Id,
    string Title,
    string Body,
    DateTime CreatedAt,
    DateTime? UpdatedAt,
    CommunityPostAuthorDto? Author
);
