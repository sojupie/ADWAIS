namespace Domain.Entities.Monitoring 
{
    public class MonitorStatus {
        public string? StatusStr { get; set; }
        public double Uptime { get; set; }
        public int? LastResponseTime { get; set; }
    }
}