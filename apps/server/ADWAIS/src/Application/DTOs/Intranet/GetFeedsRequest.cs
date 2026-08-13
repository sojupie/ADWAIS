// Part of the ADWAIS project, under the Business Source License 1.1.
// See /LICENSE for license information.
// SPDX-License-Identifier: BUSL-1.1

using System;

namespace Adwais.Application.DTOs.Intranet;

public record GetFeedsRequest
{
    public Guid? FeedSourceId { get; init; }
    public string? AuthorName { get; init; }
    public int Page { get; init; } = 1;
    public int PageSize { get; init; } = 20;
}
