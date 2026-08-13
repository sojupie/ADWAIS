// Part of the ADWAIS project, under the Business Source License 1.1.
// See /LICENSE for license information.
// SPDX-License-Identifier: BUSL-1.1

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
