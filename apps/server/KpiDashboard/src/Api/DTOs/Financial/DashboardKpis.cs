using Api.DTOs.Financial;

namespace Api.DTOs.Financial;

public class DashboardKpis
{
    public KpiMetric Revenue { get; set; } = new();
    public KpiMetric Volume { get; set; } = new();
}