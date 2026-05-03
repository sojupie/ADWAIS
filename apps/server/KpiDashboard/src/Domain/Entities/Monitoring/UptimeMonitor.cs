using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace Domain.Entities.Monitoring {
    public class UptimeMonitor {
        public int Id { get; set; }
        public Guid TenantId { get; set; }

        [Required(ErrorMessage = "NAME REQUIRED")]
        public string Name { get; set; } = string.Empty;

        [Required(ErrorMessage = "URL EMPTY")]
        [Url(ErrorMessage = "INVALID URL")]
        public string Url { get; set; } = string.Empty;
        
        public double? UptimeSla { get; set; }
        public bool UptimeMonitorEnabled { get; set; }
        public DateTimeOffset? CreationDate { get; set; }
        
        public MonitorStatus Status { get; set; } = new MonitorStatus();
        public Tenant Tenant { get; set; } = null!;
        public ICollection<ResponseTime> ResponseTimes { get; set; } = new List<ResponseTime>();
    }
}