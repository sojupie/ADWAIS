using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Adwais.Application.DTOs.Intranet;

namespace Adwais.Application.Interfaces;

public interface ICalendarEventService
{
    Task<CalendarEventDto?> GetEventByIdAsync(Guid id, CancellationToken ct = default);
    Task<IEnumerable<CalendarEventDto>> GetEventsAsync(DateTimeOffset? start, DateTimeOffset? end, CancellationToken ct = default);
    Task<CalendarEventDto> CreateEventAsync(Guid? userId, CreateCalendarEventDto dto, CancellationToken ct = default);
    Task<CalendarEventDto?> UpdateEventAsync(Guid id, UpdateCalendarEventDto dto, CancellationToken ct = default);
    Task<bool> DeleteEventAsync(Guid id, CancellationToken ct = default);
    Task<IEnumerable<CalendarEventDto>> GetTodaysEventsAsync(CancellationToken ct = default);
}
