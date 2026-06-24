using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Adwais.Application.Interfaces;
using Adwais.Domain.Entities.Intranet;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Adwais.Api.Controllers;

[ApiController]
[Route("api/intranet/newsletters")]
[Authorize(Policy = "KioskOrStaffAccess")]
public class NewsletterController(INewsletterService newsletterService) : ControllerBase
{
    private readonly INewsletterService _newsletterService = newsletterService;

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Newsletter>>> GetNewsletters(
        [FromQuery] string? category,
        CancellationToken ct = default)
    {
        var newsletters = await _newsletterService.GetNewslettersAsync(category, ct);
        return Ok(newsletters);
    }
}
