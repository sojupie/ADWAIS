namespace Api.Models;

public class TimelinePoint
{
    public string Date { get; set; } = string.Empty;
    public long Revenue { get; set; }
    public long Volume { get; set; }
}