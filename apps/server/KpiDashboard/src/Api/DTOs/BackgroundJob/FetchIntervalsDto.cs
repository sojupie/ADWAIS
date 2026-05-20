namespace Api.DTOs.BackgroundJob;

public class FetchIntervalsDto
{
    public int LatencyFetchIntervalMinutes { get; set; }
    public int UptimeFetchIntervalMinutes { get; set; }
    public int StatusFetchIntervalMinutes { get; set; }
    public int LitiumFetchIntervalMinutes { get; set; }
}