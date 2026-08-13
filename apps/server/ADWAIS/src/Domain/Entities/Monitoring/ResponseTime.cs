// Part of the ADWAIS project, under the Business Source License 1.1.
// See /LICENSE for license information.
// SPDX-License-Identifier: BUSL-1.1

namespace Adwais.Domain.Entities.Monitoring;

public class ResponseTime
{
    public Guid Id { get; set; }
    public int MonitorId { get; set; }
    public DateTimeOffset Date { get; set; }
    public double? Average { get; set; }
    public double? Lowest { get; set; }
    public double? Highest { get; set; }

    public UptimeMonitor? UptimeMonitor { get; set; }
}


