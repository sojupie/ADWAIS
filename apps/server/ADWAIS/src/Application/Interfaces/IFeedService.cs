using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Adwais.Application.DTOs.Intranet;
using Adwais.Domain.Entities.Intranet;

namespace Adwais.Application.Interfaces;

public interface IFeedService
{
    Task<IEnumerable<FeedItem>> GetFeedsAsync(GetFeedsRequest request, CancellationToken ct = default);
}
