// Part of the ADWAIS project, under the Business Source License 1.1.
// See /LICENSE for license information.
// SPDX-License-Identifier: BUSL-1.1

using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Adwais.Application.DTOs.System;

namespace Adwais.Application.Interfaces;

public interface ISystemHealthService
{
    Task<SystemHealthDto> GetHealthAsync(CancellationToken ct = default);
    Task ClearErrorsAsync(CancellationToken ct = default);
    Task<IEnumerable<BackgroundJobStatusDto>> GetRecentJobsAsync(CancellationToken ct = default);
}
