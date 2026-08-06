namespace Adwais.Application.DTOs.GlobalConfig;

public record UpdateFetchIntervalsRequestDto(
    int? OrderFetchIntervalMinutes = null,
    int? UptimeFetchIntervalMinutes = null,
    int? UserStatsFetchIntervalMinutes = null,
    int? LatencyFetchIntervalMinutes = null,
    int? FeedFetchIntervalHours = null
);
