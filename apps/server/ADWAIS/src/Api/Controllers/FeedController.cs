using System;
using System.Threading;
using System.Threading.Tasks;
using Adwais.Application.DTOs.Intranet;
using Adwais.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Adwais.Api.Controllers;

[ApiController]
[Route("api/intranet/feeds")]
[Authorize(Policy = "KioskOrStaffAccess")]
public class FeedController(IFeedService feedService) : ControllerBase
{
    private readonly IFeedService _feedService = feedService;

    [HttpGet]
    public async Task<IActionResult> GetFeeds(
        [FromQuery] GetFeedsRequest request,
        CancellationToken ct)
    {
        var feeds = await _feedService.GetFeedsAsync(request.FeedSourceId, request.Page, request.PageSize, ct);
        return Ok(feeds);
    }
}
