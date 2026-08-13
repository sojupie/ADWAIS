// Part of the ADWAIS project, under the Business Source License 1.1.
// See /LICENSE for license information.
// SPDX-License-Identifier: BUSL-1.1

using System.Security.Claims;
using Adwais.Application.DTOs.Intranet;
using Adwais.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Adwais.Api.Controllers.Calendar;

[ApiController]
[Route("api/intranet/events")]
public class CalendarEventController(ICalendarEventService eventService) : ControllerBase
{
    private readonly ICalendarEventService _eventService = eventService;

    [HttpGet]
    [Authorize(Policy = "KioskOrStaffAccess")]
    public async Task<ActionResult<IEnumerable<CalendarEventDto>>> GetEvents(
        [FromQuery] DateTimeOffset? start,
        [FromQuery] DateTimeOffset? end,
        CancellationToken ct)
    {
        var events = await _eventService.GetEventsAsync(start, end, ct);
        return Ok(events);
    }

    [HttpGet("today")]
    [Authorize(Policy = "KioskOrStaffAccess")]
    public async Task<ActionResult<IEnumerable<CalendarEventDto>>> GetTodaysEvents(CancellationToken ct)
    {
        var events = await _eventService.GetTodaysEventsAsync(ct);
        return Ok(events);
    }

    [HttpGet("{id:guid}")]
    [Authorize(Policy = "KioskOrStaffAccess")]
    public async Task<ActionResult<CalendarEventDto>> GetEvent(Guid id, CancellationToken ct)
    {
        var calendarEvent = await _eventService.GetEventByIdAsync(id, ct);
        if (calendarEvent == null) return NotFound();
        return Ok(calendarEvent);
    }

    [HttpPost]
    [Authorize(Policy = "StaffAccess")]
    public async Task<ActionResult<CalendarEventDto>> CreateEvent([FromBody] CreateCalendarEventDto dto, CancellationToken ct)
    {
        var nameIdentifier = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        Guid? userId = null;
        if (!string.IsNullOrEmpty(nameIdentifier) && Guid.TryParse(nameIdentifier, out var parsedId))
        {
            userId = parsedId;
        }

        var calendarEvent = await _eventService.CreateEventAsync(userId, dto, ct);
        return CreatedAtAction(nameof(GetEvent), new { id = calendarEvent.Id }, calendarEvent);
    }

    [HttpPatch("{id:guid}")]
    [Authorize(Policy = "StaffAccess")]
    public async Task<ActionResult<CalendarEventDto>> UpdateEvent(Guid id, [FromBody] UpdateCalendarEventDto dto, CancellationToken ct)
    {
        var calendarEvent = await _eventService.UpdateEventAsync(id, dto, ct);
        if (calendarEvent == null) return NotFound();
        return Ok(calendarEvent);
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
