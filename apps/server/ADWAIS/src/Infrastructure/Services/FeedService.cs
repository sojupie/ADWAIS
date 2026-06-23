using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Adwais.Application.Interfaces;
using Adwais.Domain.Entities.Intranet;
using Adwais.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Adwais.Infrastructure.Services;

public class FeedService(IDbContextFactory<AnalyticsDbContext> dbContextFactory) : IFeedService
{
    private readonly IDbContextFactory<AnalyticsDbContext> _dbContextFactory = dbContextFactory;

    public async Task<IEnumerable<FeedItem>> GetFeedsAsync(Guid? feedSourceId, int page, int pageSize, CancellationToken ct = default)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 10;
        if (pageSize > 100) pageSize = 100;

        await using var db = await _dbContextFactory.CreateDbContextAsync(ct);

        var query = db.FeedItems
            .Include(fi => fi.FeedSource)
            .AsNoTracking();

        if (feedSourceId.HasValue)
        {
            query = query.Where(fi => fi.FeedSourceId == feedSourceId.Value);
        }

        return await query
            .OrderByDescending(fi => fi.PublishDate)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);
    }
}
