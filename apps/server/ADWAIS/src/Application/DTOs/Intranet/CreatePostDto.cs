namespace Adwais.Application.DTOs.Intranet;

public record CreatePostDto
{
    public required string Title { get; set; }
    public required string Body { get; set; }
}
