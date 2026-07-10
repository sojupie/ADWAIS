using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Adwais.Application.DTOs.Intranet;

namespace Adwais.Application.Interfaces;

public interface ICalendarSubscriptionService
{
    Task<CalendarSubscriptionDto?> GetSubscriptionByIdAsync(Guid id, CancellationToken ct = default);
    Task<IEnumerable<CalendarSubscriptionDto>> GetSubscriptionsAsync(CancellationToken ct = default);
    Task<CalendarSubscriptionDto> CreateSubscriptionAsync(CreateCalendarSubscriptionDto dto, CancellationToken ct = default);
    Task<CalendarSubscriptionDto?> UpdateSubscriptionAsync(Guid id, UpdateCalendarSubscriptionDto dto, CancellationToken ct = default);
    Task<bool> DeleteSubscriptionAsync(Guid id, CancellationToken ct = default);
    Task TriggerSyncAsync(Guid id, CancellationToken ct = default);
    Task TriggerAllSyncsAsync(CancellationToken ct = default);
}
