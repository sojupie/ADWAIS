// Part of the ADWAIS project, under the Business Source License 1.1.
// See /LICENSE for license information.
// SPDX-License-Identifier: BUSL-1.1

using System;
using Adwais.Domain.Enums;

namespace Adwais.Application.DTOs.Intranet;

public record UpdateCalendarEventDto(
    string? Title,
    string? Description,
    string? Location,
    DateTimeOffset? StartTime,
    DateTimeOffset? EndTime,
    EventType? EventType,
    bool? IsRecurring,
    RecurrenceType? Recurrence
);
