using System;
using Adwais.Domain.Enums;

namespace Adwais.Application.DTOs.Intranet;

public record OfficeEventDto(
    Guid Id,
    string Title,
    string? Description,
    string? Location,
    DateTimeOffset StartTime,
    DateTimeOffset EndTime,
    EventType EventType,
    bool IsRecurring,
    RecurrenceType Recurrence,
    Guid? UserId,
    string? UserName,
    string? ExternalUid,
    Guid? CalendarSubscriptionId
);
