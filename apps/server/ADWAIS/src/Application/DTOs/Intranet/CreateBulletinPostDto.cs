namespace Adwais.Application.DTOs.Intranet;

public record CreateBulletinPostDto
{
    public required string Title { get; set; }
    public required string Body { get; set; }
}
