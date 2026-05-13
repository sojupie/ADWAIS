namespace Api.DTOs.Financial;

public class TimelinePoint
{
    public string Date { get; set; } = string.Empty;
    public long Revenue { get; set; }
    public long Volume { get; set; }
}