using System;
using System.Threading;
using System.Threading.Tasks;
using Adwais.Application.DTOs.Financial.Upstream;
using Adwais.Application.DTOs.Intranet;
using Adwais.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Adwais.Api.Controllers;

[ApiController]
[Route("api/webhooks")]
[AllowAnonymous]
public class WebhooksController(
    ILitiumIngestionService ingestionService,
    IConfiguration configuration,
    ILogger<WebhooksController> logger,
    INewsletterWebhookService newsletterWebhookService)
    : ControllerBase
{
    [HttpPost("motastic/{tenantId}")]
    public async Task<IActionResult> ReceiveMotasticWebhook(
        [FromRoute] Guid tenantId,
        [FromHeader(Name = "X-Api-Key")] string? apiKey,
        [FromBody] LitiumSyncResponse.LitiumOrderDto? payload,
        CancellationToken ct)
    {
        if (string.IsNullOrEmpty(apiKey) || apiKey != configuration["Webhooks:MotasticApiKey"])
        {
            return Unauthorized();
        }

        if (payload == null)
        {
            return BadRequest(new { Error = "Payload cannot be null." });
        }

        try
        {
            await ingestionService.IngestSingleOrderAsync(tenantId, payload, ct);
            return Ok();
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to ingest webhook for tenant {TenantId}", tenantId);
            return StatusCode(500, "Internal server error during webhook ingestion");
        }
    }

    [HttpPost("newsletter")]
    public async Task<IActionResult> ReceiveNewsletter(
        [FromBody] CreateNewsletterDto? payload,
        CancellationToken ct)
    {
        var apiKey = Request.Headers["X-Api-Key"].ToString();
        if (string.IsNullOrEmpty(apiKey) || apiKey != configuration["Webhooks:NewsletterApiKey"])
        {
            return Unauthorized();
        }

        if (payload == null)
        {
            return BadRequest(new { Error = "Payload cannot be null." });
        }

        var newsletterId = await newsletterWebhookService.IngestNewsletterAsync(payload, ct);

        return Ok(new { Id = newsletterId });
    }
}
