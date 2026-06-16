namespace Adwais.Api.DTOs.Kiosk;

public class KioskTokenResponseDto
{
    public required string Token { get; set; }
    public int ExpiresInDays { get; set; }
}
