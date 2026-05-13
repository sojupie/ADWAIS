namespace Api.DTOs.Financial;

public class DashboardSummaryResponse
{
    public string Period { get; set; } = string.Empty;
    public DashboardKpis Kpis { get; set; } = new();
    public DashboardCharts Charts { get; set; } = new();
}