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
