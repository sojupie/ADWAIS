using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Adwais.Domain.Entities.Intranet;

namespace Adwais.Application.Interfaces;

public interface IFeedService
{
    Task<IEnumerable<FeedItem>> GetFeedsAsync(Guid? feedSourceId, int page, int pageSize, CancellationToken ct = default);
}
