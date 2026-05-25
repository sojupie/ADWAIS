namespace Api.DTOs.BackgroundJob;

public record UpdateFetchIntervalsRequestDto(
    int? LitiumFetchIntervalMinutes = null, 
    int? UptimeFetchIntervalMinutes = null,
    int? UserStatsFetchIntervalMinutes = null,
    int? LatencyFetchIntervalMinutes = null

    );