using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Adwais.Api.DTOs.Kiosk;
using Adwais.Application.Interfaces;

namespace Adwais.Api.Controllers;

[ApiController]
[Route("api/kiosk")]
public class KioskAuthController(IKioskService kioskService) : ControllerBase
{
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterKioskRequestDto request, CancellationToken ct)
    {
        var code = await kioskService.RegisterDeviceAsync(request.DeviceId, ct);
        return Ok(new RegisterKioskResponseDto { ActivationCode = code });
    }

    [HttpPost("activate")]
    [Authorize(Policy = "StaffAccess")]
    public async Task<IActionResult> Activate([FromBody] ActivateKioskRequestDto request)
    {
        var activated = await kioskService.ActivateDeviceAsync(request.ActivationCode);
        if (!activated)
        {
            return BadRequest("Activation code has expired or is invalid.");
        }
        return Ok();
    }

    [HttpGet("token")]
    public async Task<IActionResult> GetToken([FromQuery] string deviceId)
    {
        var token = await kioskService.GetTokenAsync(deviceId);
        if (string.IsNullOrEmpty(token))
        {
            return Unauthorized("Kiosk device is not authorized.");
        }
        return Ok(new KioskTokenResponseDto { Token = token, ExpiresInDays = 30 });
    }
}
