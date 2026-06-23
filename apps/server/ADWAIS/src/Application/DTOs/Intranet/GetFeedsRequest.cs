using System;

namespace Adwais.Application.DTOs.Intranet;

public record GetFeedsRequest
{
    public Guid? FeedSourceId { get; init; }
    public int Page { get; init; } = 1;
    public int PageSize { get; init; } = 10;
}
