// Part of the ADWAIS project, under the Business Source License 1.1.
// See /LICENSE for license information.
// SPDX-License-Identifier: BUSL-1.1

using Hangfire;

namespace Adwais.Infrastructure.Helpers;

public static class CronHelper
{
    /// <summary>
    /// Converts a polling interval in minutes to a valid Hangfire cron expression.
    /// </summary>
    public static string FromMinutes(int minutes)
    {
        var m = Math.Clamp(minutes, 1, 1380); // 1 min to 23 hours
        return m < 60
            ? Cron.MinuteInterval(m)
            : m < 120
                ? Cron.Hourly()
                : $"0 */{Math.Clamp(m / 60, 1, 23)} * * *";
    }
}


