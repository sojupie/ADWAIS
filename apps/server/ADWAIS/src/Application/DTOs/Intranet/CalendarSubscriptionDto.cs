using System;

namespace Adwais.Application.DTOs.Intranet;

public record CalendarSubscriptionDto(
    Guid Id,
    string Name,
    string Url,
    bool IsActive,
    DateTimeOffset? LastPolledAt,
    DateTimeOffset? LastSuccessAt,
    string? LastSyncError
);
