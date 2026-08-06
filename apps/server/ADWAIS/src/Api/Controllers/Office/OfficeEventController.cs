using System.Security.Claims;
using Adwais.Application.DTOs.Intranet;
using Adwais.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Adwais.Api.Controllers.Office;

[ApiController]
[Route("api/intranet/events")]
public class OfficeEventController(IOfficeEventService eventService) : ControllerBase
{
    private readonly IOfficeEventService _eventService = eventService;

    [HttpGet]
    [Authorize(Policy = "KioskOrStaffAccess")]
    public async Task<ActionResult<IEnumerable<OfficeEventDto>>> GetEvents(
        [FromQuery] DateTimeOffset? start,
        [FromQuery] DateTimeOffset? end,
        CancellationToken ct)
    {
        var events = await _eventService.GetEventsAsync(start, end, ct);
        return Ok(events);
    }

    [HttpGet("today")]
    [Authorize(Policy = "KioskOrStaffAccess")]
    public async Task<ActionResult<IEnumerable<OfficeEventDto>>> GetTodaysEvents(CancellationToken ct)
    {
        var events = await _eventService.GetTodaysEventsAsync(ct);
        return Ok(events);
    }

    [HttpGet("{id:guid}")]
    [Authorize(Policy = "KioskOrStaffAccess")]
    public async Task<ActionResult<OfficeEventDto>> GetEvent(Guid id, CancellationToken ct)
    {
        var officeEvent = await _eventService.GetEventByIdAsync(id, ct);
        if (officeEvent == null) return NotFound();
        return Ok(officeEvent);
    }

    [HttpPost]
    [Authorize(Policy = "StaffAccess")]
    public async Task<ActionResult<OfficeEventDto>> CreateEvent([FromBody] CreateOfficeEventDto dto, CancellationToken ct)
    {
        var nameIdentifier = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        Guid? userId = null;
        if (!string.IsNullOrEmpty(nameIdentifier) && Guid.TryParse(nameIdentifier, out var parsedId))
        {
            userId = parsedId;
        }

        var officeEvent = await _eventService.CreateEventAsync(userId, dto, ct);
        return CreatedAtAction(nameof(GetEvent), new { id = officeEvent.Id }, officeEvent);
    }

    [HttpPatch("{id:guid}")]
    [Authorize(Policy = "StaffAccess")]
    public async Task<ActionResult<OfficeEventDto>> UpdateEvent(Guid id, [FromBody] UpdateOfficeEventDto dto, CancellationToken ct)
    {
        var officeEvent = await _eventService.UpdateEventAsync(id, dto, ct);
        if (officeEvent == null) return NotFound();
        return Ok(officeEvent);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = "StaffAccess")]
    public async Task<IActionResult> DeleteEvent(Guid id, CancellationToken ct)
    {
        var success = await _eventService.DeleteEventAsync(id, ct);
        if (!success) return NotFound();
        return NoContent();
    }
}
