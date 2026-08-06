using System.Security.Claims;
using Adwais.Application.DTOs.Intranet;
using Adwais.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Adwais.Api.Controllers.Calendar;

[ApiController]
[Route("api/intranet/calendar")]
public class CalendarFeedController(ICalendarFeedService feedService) : ControllerBase
{
    private readonly ICalendarFeedService _feedService = feedService;

    [HttpGet("feed.ics")]
    [AllowAnonymous]
    public async Task<IActionResult> GetFeed([FromQuery] string token, CancellationToken ct)
    {
        if (string.IsNullOrEmpty(token))
        {
            return BadRequest("A calendar feed token is required.");
        }

        var fileBytes = await _feedService.GenerateIcsFeedAsync(token, ct);
        return File(fileBytes, "text/calendar", "feed.ics");
    }

    [HttpGet("token")]
    [Authorize(Policy = "StaffAccess")]
    public async Task<ActionResult<CalendarTokenDto>> GetToken(CancellationToken ct)
    {
        var nameIdentifier = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
        if (string.IsNullOrEmpty(nameIdentifier) || !Guid.TryParse(nameIdentifier, out var userId))
        {
            return Unauthorized("User context is invalid.");
        }

        var token = await _feedService.GetUserCalendarFeedTokenAsync(userId, ct);
        return Ok(new CalendarTokenDto { Token = token });
    }

    [HttpPost("token/regenerate")]
    [Authorize(Policy = "StaffAccess")]
    public async Task<ActionResult<CalendarTokenDto>> RegenerateToken(CancellationToken ct)
    {
        var nameIdentifier = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
        if (string.IsNullOrEmpty(nameIdentifier) || !Guid.TryParse(nameIdentifier, out var userId))
        {
            return Unauthorized("User context is invalid.");
        }

        var token = await _feedService.RegenerateUserCalendarFeedTokenAsync(userId, ct);
        return Ok(new CalendarTokenDto { Token = token });
    }
}
