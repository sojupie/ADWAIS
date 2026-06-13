namespace Adwais.Api.DTOs.BackgroundJob;

public record FetchIntervalsDto
{
    public int LatencyFetchIntervalMinutes { get; init; }
    public int UptimeFetchIntervalMinutes { get; init; }
    public int StatusFetchIntervalMinutes { get; init; }
    public int LitiumFetchIntervalMinutes { get; init; }
    public int UserStatsFetchIntervalMinutes { get; init; }
}

