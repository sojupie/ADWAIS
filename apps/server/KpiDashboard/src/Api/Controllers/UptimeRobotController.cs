using System.Text.Json;
using Infrastructure.Services.Monitoring;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UptimeRobotController(IUptimeRobotService uptimeRobotService) : ControllerBase
{
    [HttpGet("monitors")]
    public async Task<IActionResult> GetMonitors()
    {
        try
        {
            var monitors = await uptimeRobotService.GetAllMonitorsAsync();
            return Ok(monitors);
        }
        catch (Exception ex)
        {
            return StatusCode(500, ex.Message);
        }
    }

    [HttpGet("monitors/{id:int}/stats/uptime")]
    public async Task<IActionResult> GetMonitorUptime(int id)
    {
        try
        {
            var uptime = await uptimeRobotService.GetUptimeAsync(id);
            return Ok(new { Uptime = uptime });
        }
        catch (Exception ex)
        {
            return StatusCode(500, ex.Message);
        }
    }

    [HttpGet("monitors/{id:int}/stats/response-time")]
    public async Task<IActionResult> GetMonitorResponseTime(int id)
    {
        try
        {
            var responseTime = await uptimeRobotService.GetResponseTimeAsync(id);
            return Ok(new { ResponseTime = responseTime });
        }
        catch (Exception ex)
        {
            return StatusCode(500, ex.Message);
        }
    }

    [HttpDelete("monitors/{id:int}")]
    public async Task<IActionResult> DeleteMonitor(int id)
    {
        try
        {
            await uptimeRobotService.DeleteMonitorAsync(id);
            return NoContent();
        }
        catch (Exception ex)
        {
            return StatusCode(500, ex.Message);
        }
    }

    [HttpPost("monitors/{id:int}/pause")]
    public async Task<IActionResult> PauseMonitor(int id)
    {
        try
        {
            await uptimeRobotService.PauseMonitorAsync(id);
            return Ok();
        }
        catch (Exception ex)
        {
            return StatusCode(500, ex.Message);
        }
    }

    [HttpPost("monitors/{id:int}/start")]
    public async Task<IActionResult> StartMonitor(int id)
    {
        try
        {
            await uptimeRobotService.StartMonitorAsync(id);
            return Ok();
        }
        catch (Exception ex)
        {
            return StatusCode(500, ex.Message);
        }
    }

    public class CreateMonitorRequest
    {
        public string Name { get; set; } = string.Empty;
        public string Url { get; set; } = string.Empty;
    }

    [HttpPost("create-monitor")]
    public async Task<IActionResult> CreateMonitor([FromBody] CreateMonitorRequest request)
    {
        try
        {
            var id = await uptimeRobotService.CreateMonitorAsync(request.Name, request.Url);
            return Ok(new { Id = id });
        }
        catch (Exception ex)
        {
            return StatusCode(500, ex.Message);
        }
    }

    [HttpGet("user/me")]
    public async Task<IActionResult> GetAccountDetails()
    {
        try
        {
            var details = await uptimeRobotService.GetAccountDetailsAsync();
            return Ok(details);
        }
        catch (Exception ex)
        {
            return StatusCode(500, ex.Message);
        }
    }
}
