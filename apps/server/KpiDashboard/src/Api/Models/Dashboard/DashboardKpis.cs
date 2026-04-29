namespace Api.Models;

public class DashboardKpis
{
    public KpiMetric Revenue { get; set; } = new();
    public KpiMetric Volume { get; set; } = new();
}