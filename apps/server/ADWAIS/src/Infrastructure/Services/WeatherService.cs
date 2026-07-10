using System;
using System.Net.Http;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading;
using System.Threading.Tasks;
using Adwais.Application.DTOs.Weather;
using Adwais.Application.Interfaces;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;

namespace Adwais.Infrastructure.Services;

/// <summary>
/// Resolves the configured WeatherLocation string to coordinates via Open-Meteo Geocoding API,
/// then fetches current weather from the Open-Meteo Forecast API.
/// No API key required. Responses are cached for 10 minutes.
/// </summary>
public class WeatherService(
    HttpClient httpClient,
    IGlobalConfigService configService,
    IMemoryCache cache,
    ILogger<WeatherService> logger) : IWeatherService
{
    private static readonly TimeSpan CacheDuration = TimeSpan.FromMinutes(10);
    private const string CacheKey = "weather:current";

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    public async Task<WeatherDto> GetCurrentWeatherAsync(CancellationToken ct = default)
    {
        var config = await configService.GetConfigAsync(ct);
        var location = config.WeatherLocation;

        if (string.IsNullOrWhiteSpace(location))
        {
            throw new InvalidOperationException("Weather location is not configured.");
        }

        if (cache.TryGetValue(CacheKey, out WeatherDto? cached) && cached is not null)
            return cached;

        var (lat, lon, resolvedName) = await GeocodeAsync(location, ct);
        var dto = await FetchForecastAsync(lat, lon, resolvedName, ct);

        var duration = TimeSpan.FromMinutes(config.WeatherFetchIntervalMinutes > 0 ? config.WeatherFetchIntervalMinutes : 15);
        cache.Set(CacheKey, dto, duration);
        return dto;
    }

    private async Task<(double lat, double lon, string name)> GeocodeAsync(string location, CancellationToken ct)
    {
        var url = $"https://geocoding-api.open-meteo.com/v1/search?name={Uri.EscapeDataString(location)}&count=1&language=en&format=json";

        var response = await httpClient.GetFromJsonAsync<GeocodingResponse>(url, JsonOptions, ct)
            ?? throw new InvalidOperationException($"Geocoding API returned null for location '{location}'.");

        if (response.Results is not { Length: > 0 })
            throw new InvalidOperationException($"No geocoding results found for location '{location}'.");

        var result = response.Results[0];
        logger.LogDebug("Resolved '{Input}' to ({Lat},{Lon}) — {Name}", location, result.Latitude, result.Longitude, result.Name);
        return (result.Latitude, result.Longitude, result.Name);
    }

    private async Task<WeatherDto> FetchForecastAsync(double lat, double lon, string locationName, CancellationToken ct)
    {
        var latStr = lat.ToString(System.Globalization.CultureInfo.InvariantCulture);
        var lonStr = lon.ToString(System.Globalization.CultureInfo.InvariantCulture);
        var url = $"https://api.open-meteo.com/v1/forecast" +
                  $"?latitude={latStr}&longitude={lonStr}" +
                  $"&current=temperature_2m,weather_code,wind_speed_10m" +
                  $"&wind_speed_unit=kmh";

        var response = await httpClient.GetFromJsonAsync<ForecastResponse>(url, JsonOptions, ct)
            ?? throw new InvalidOperationException("Open-Meteo forecast API returned null.");

        var current = response.Current;
        return new WeatherDto(
            locationName,
            current.Temperature2m,
            current.WeatherCode,
            current.WindSpeed10m,
            DateTimeOffset.UtcNow
        );
    }

    // ── Internal deserialization models ───────────────────────────────────────

    private sealed record GeocodingResponse(
        [property: JsonPropertyName("results")] GeocodingResult[]? Results
    );

    private sealed record GeocodingResult(
        [property: JsonPropertyName("name")] string Name,
        [property: JsonPropertyName("latitude")] double Latitude,
        [property: JsonPropertyName("longitude")] double Longitude
    );

    private sealed record ForecastResponse(
        [property: JsonPropertyName("current")] CurrentWeather Current
    );

    private sealed record CurrentWeather(
        [property: JsonPropertyName("temperature_2m")] double Temperature2m,
        [property: JsonPropertyName("weather_code")] int WeatherCode,
        [property: JsonPropertyName("wind_speed_10m")] double WindSpeed10m
    );
}
