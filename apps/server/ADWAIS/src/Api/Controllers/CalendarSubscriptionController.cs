using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Adwais.Application.DTOs.Intranet;
using Adwais.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Adwais.Api.Controllers;

[ApiController]
[Route("api/intranet/calendar/subscriptions")]
public class CalendarSubscriptionController(ICalendarSubscriptionService subscriptionService) : ControllerBase
{
    private readonly ICalendarSubscriptionService _subscriptionService = subscriptionService;

    [HttpGet]
    [Authorize(Policy = "KioskOrStaffAccess")]
    public async Task<ActionResult<IEnumerable<CalendarSubscriptionDto>>> GetSubscriptions(CancellationToken ct)
    {
        var subs = await _subscriptionService.GetSubscriptionsAsync(ct);
        return Ok(subs);
    }

    [HttpGet("{id:guid}")]
    [Authorize(Policy = "KioskOrStaffAccess")]
    public async Task<ActionResult<CalendarSubscriptionDto>> GetSubscription(Guid id, CancellationToken ct)
    {
        var sub = await _subscriptionService.GetSubscriptionByIdAsync(id, ct);
        if (sub == null) return NotFound();
        return Ok(sub);
    }

    [HttpPost]
    [Authorize(Policy = "AdminOnly")]
    public async Task<ActionResult<CalendarSubscriptionDto>> CreateSubscription([FromBody] CreateCalendarSubscriptionDto dto, CancellationToken ct)
    {
        var sub = await _subscriptionService.CreateSubscriptionAsync(dto, ct);
        return CreatedAtAction(nameof(GetSubscription), new { id = sub.Id }, sub);
    }

    [HttpPatch("{id:guid}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<ActionResult<CalendarSubscriptionDto>> UpdateSubscription(Guid id, [FromBody] UpdateCalendarSubscriptionDto dto, CancellationToken ct)
    {
        var sub = await _subscriptionService.UpdateSubscriptionAsync(id, dto, ct);
        if (sub == null) return NotFound();
        return Ok(sub);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> DeleteSubscription(Guid id, CancellationToken ct)
    {
        var success = await _subscriptionService.DeleteSubscriptionAsync(id, ct);
        if (!success) return NotFound();
        return NoContent();
    }

    [HttpPost("{id:guid}/sync")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> SyncSubscription(Guid id, CancellationToken ct)
    {
        await _subscriptionService.TriggerSyncAsync(id, ct);
        return Ok();
    }
}
