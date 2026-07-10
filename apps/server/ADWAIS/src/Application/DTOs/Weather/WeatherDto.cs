namespace Adwais.Application.DTOs.Weather;

/// <param name="Location">The resolved location name from config.</param>
/// <param name="Temperature">Current temperature in degrees Celsius.</param>
/// <param name="WeatherCode">WMO weather interpretation code.</param>
/// <param name="WindSpeed">Wind speed at 10 m (km/h).</param>
/// <param name="FetchedAt">UTC timestamp of when this reading was fetched.</param>
public record WeatherDto(
    string Location,
    double Temperature,
    int WeatherCode,
    double WindSpeed,
    DateTimeOffset FetchedAt
);
