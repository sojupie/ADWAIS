using System.ComponentModel.DataAnnotations;

namespace Domain.Entities.Monitoring {
    public class Monitor {

        [Required(ErrorMessage = "NAME REQUIRED")]
        public string Name { get; set; } = string.Empty;

        [Required(ErrorMessage = "URL EMPTY")]
        [Url(ErrorMessage = "INVALID URL")]
        public string Url { get; set; } = string.Empty;
        
        public int UptimeRobotId { get; set; }

        [Range(0, 100, ErrorMessage = "SLA Must be between 0 and 100")]
        public double SlaTarget { get; set; } = 99.9;
        
        public MonitorStatus Status { get; set; } = new MonitorStatus();
    }
}