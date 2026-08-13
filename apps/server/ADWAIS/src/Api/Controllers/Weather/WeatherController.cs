// Part of the ADWAIS project, under the Business Source License 1.1.
// See /LICENSE for license information.
// SPDX-License-Identifier: BUSL-1.1

using Adwais.Application.DTOs.Weather;
using Adwais.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Adwais.Api.Controllers.Weather;

[ApiController]
[Route("api/weather")]
public class WeatherController(IWeatherService weatherService) : ControllerBase
{
    private readonly IWeatherService _weatherService = weatherService;

    /// <summary>Returns current weather for the configured location.</summary>
    [HttpGet]
    [Authorize(Policy = "KioskOrStaffAccess")]
    public async Task<ActionResult<WeatherDto>> GetCurrentWeather(CancellationToken ct)
    {
        var weather = await _weatherService.GetCurrentWeatherAsync(ct);
        return Ok(weather);
    }
}
