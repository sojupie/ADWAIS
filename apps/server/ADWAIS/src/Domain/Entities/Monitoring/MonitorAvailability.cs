// Part of the ADWAIS project, under the Business Source License 1.1.
// See /LICENSE for license information.
// SPDX-License-Identifier: BUSL-1.1

using System;

namespace Adwais.Domain.Entities.Monitoring;

public class MonitorAvailability
{
    public Guid Id { get; set; }
    public int MonitorId { get; set; }
    public DateTimeOffset Date { get; set; }
    public double? UptimePercentage { get; set; }
    public bool IsFinalized { get; set; }

    public UptimeMonitor? UptimeMonitor { get; set; }
}


