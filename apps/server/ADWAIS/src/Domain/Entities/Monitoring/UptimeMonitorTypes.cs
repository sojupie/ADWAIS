// Part of the ADWAIS project, under the Business Source License 1.1.
// See /LICENSE for license information.
// SPDX-License-Identifier: BUSL-1.1

namespace Adwais.Domain.Entities.Monitoring;

public static class UptimeMonitorTypes
{
    public const string Http = "HTTP";

    public static string Normalize(string? type) =>
        string.IsNullOrWhiteSpace(type) ? Http : type.Trim().ToUpperInvariant();
}
