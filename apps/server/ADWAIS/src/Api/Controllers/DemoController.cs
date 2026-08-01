using Adwais.Application.Interfaces;
using Adwais.Api.DTOs.Kiosk;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Adwais.Api.Controllers;

[ApiController]
[Route("api/demo")]
public class DemoController(ITokenService tokenService, IConfiguration configuration) : ControllerBase
{
    [HttpGet("token")]
    [AllowAnonymous]
    public ActionResult<KioskTokenResponseDto> GetDemoToken()
    {
        if (!configuration.GetValue<bool>("Authentication:EnableDemoAccess"))
        {
            return NotFound();
        }

        var token = tokenService.GenerateKioskToken("demo-visitor", "Viewer");
        return Ok(new KioskTokenResponseDto { Token = token, ExpiresInDays = 30 });
    }
}
