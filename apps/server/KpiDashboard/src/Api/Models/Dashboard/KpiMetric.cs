namespace Api.Models;

public class KpiMetric
{
    public long Current { get; set; }
    public long Previous { get; set; }
    public double DeltaPercentage => Previous == 0 ? 0 : Math.Round(((double)(Current - Previous) / Previous) * 100, 2);
}