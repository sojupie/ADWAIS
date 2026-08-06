using Adwais.Application.DTOs.Intranet;
using Adwais.Application.Interfaces;
using Adwais.Domain.Entities.Intranet;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Adwais.Api.Controllers.Content;

[ApiController]
[Route("api/intranet/feeds")]
[Authorize(Policy = "KioskOrStaffAccess")]
public class FeedController(IFeedService feedService) : ControllerBase
{
    private readonly IFeedService _feedService = feedService;

    [HttpGet]
    public async Task<ActionResult<IEnumerable<FeedItem>>> GetFeeds(
        [FromQuery] GetFeedsRequest request,
        CancellationToken ct)
    {
        var feeds = await _feedService.GetFeedsAsync(request, ct);
        return Ok(feeds);
    }
}

