using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Adwais.Application.DTOs.Intranet;

namespace Adwais.Application.Interfaces;

public interface IOfficeEventService
{
    Task<OfficeEventDto?> GetEventByIdAsync(Guid id, CancellationToken ct = default);
    Task<IEnumerable<OfficeEventDto>> GetEventsAsync(DateTimeOffset? start, DateTimeOffset? end, CancellationToken ct = default);
    Task<OfficeEventDto> CreateEventAsync(Guid? userId, CreateOfficeEventDto dto, CancellationToken ct = default);
    Task<OfficeEventDto?> UpdateEventAsync(Guid id, UpdateOfficeEventDto dto, CancellationToken ct = default);
    Task<bool> DeleteEventAsync(Guid id, CancellationToken ct = default);
    Task<IEnumerable<OfficeEventDto>> GetTodaysEventsAsync(CancellationToken ct = default);
}
