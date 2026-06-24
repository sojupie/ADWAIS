using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Adwais.Application.DTOs.Intranet;
using Adwais.Application.Interfaces;
using Adwais.Domain.Entities.Intranet;
using Adwais.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Adwais.Infrastructure.Services;

public class FeedService(IDbContextFactory<AnalyticsDbContext> dbContextFactory) : IFeedService
{
    private readonly IDbContextFactory<AnalyticsDbContext> _dbContextFactory = dbContextFactory;

    public async Task<IEnumerable<FeedItem>> GetFeedsAsync(GetFeedsRequest request, CancellationToken ct = default)
    {
        var page = request.Page < 1 ? 1 : request.Page;
        var pageSize = request.PageSize < 1 ? 10 : (request.PageSize > 100 ? 100 : request.PageSize);

        await using var db = await _dbContextFactory.CreateDbContextAsync(ct);

        var query = db.FeedItems
            .Include(fi => fi.FeedSource)
            .AsNoTracking();

        if (request.FeedSourceId.HasValue)
        {
            query = query.Where(fi => fi.FeedSourceId == request.FeedSourceId.Value);
        }

        if (!string.IsNullOrWhiteSpace(request.AuthorName))
        {
            var authorLower = request.AuthorName.ToLower();
            query = query.Where(fi => fi.Author != null && fi.Author.ToLower().Contains(authorLower));
        }

        return await query
            .OrderByDescending(fi => fi.PublishDate)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);
    }
}
