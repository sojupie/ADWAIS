using Adwais.Application.DTOs.Financial.Upstream;
using Adwais.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Adwais.Api.Controllers;

[ApiController]
[Route("api/webhooks")]
public class WebhooksController(
    ILitiumIngestionService ingestionService,
    IConfiguration configuration,
    ILogger<WebhooksController> logger)
    : ControllerBase
{
    [HttpPost("motastic/{tenantId}")]
    public async Task<IActionResult> ReceiveMotasticWebhook(
        [FromRoute] Guid tenantId,
        [FromBody] LitiumSyncResponse.LitiumOrderDto? payload,
        CancellationToken ct)
    {
        if (!Request.Headers.TryGetValue("X-Api-Key", out var apiKey) || apiKey != configuration["Webhooks:MotasticApiKey"])
        {
            return Unauthorized();
        }

        if (string.IsNullOrWhiteSpace(payload?.OrderNumber))
        {
            return BadRequest("Payload must contain an OrderNumber.");
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
}
