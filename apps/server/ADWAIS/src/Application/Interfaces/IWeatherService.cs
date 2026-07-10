using System.Threading;
using System.Threading.Tasks;
using Adwais.Application.DTOs.Weather;

namespace Adwais.Application.Interfaces;

public interface IWeatherService
{
    /// <summary>Fetches current weather for the configured WeatherLocation.</summary>
    Task<WeatherDto> GetCurrentWeatherAsync(CancellationToken ct = default);
}
