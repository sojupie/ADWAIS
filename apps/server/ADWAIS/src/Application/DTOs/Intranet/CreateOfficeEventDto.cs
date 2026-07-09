using System;
using Adwais.Domain.Enums;

namespace Adwais.Application.DTOs.Intranet;

public record CreateOfficeEventDto(
    string Title,
    string? Description,
    string? Location,
    DateTimeOffset StartTime,
    DateTimeOffset EndTime,
    EventType EventType,
    bool IsImportant,
    bool IsRecurring,
    bool IsSpecial,
    RecurrenceType Recurrence
);
