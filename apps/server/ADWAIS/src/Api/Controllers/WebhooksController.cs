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
}
