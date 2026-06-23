namespace Adwais.Application.DTOs.Intranet;

public record CreateNewsletterDto
{
    public required string Title { get; set; }
    public required string Body { get; set; }
    public required string Category { get; set; }
}
