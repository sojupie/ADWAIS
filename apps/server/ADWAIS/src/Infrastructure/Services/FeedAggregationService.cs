using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using Adwais.Application.Interfaces;
using Adwais.Domain.Entities.Intranet;
using Adwais.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Adwais.Infrastructure.Services;

public class FeedAggregationService(
    IDbContextFactory<AnalyticsDbContext> contextFactory,
    IEnumerable<IFeedParser> parsers,
    HttpClient httpClient,
    ILogger<FeedAggregationService> logger,
    ISystemEventService eventService)
    : IFeedAggregationService
{
    private readonly IDbContextFactory<AnalyticsDbContext> _contextFactory = contextFactory;
    private readonly IEnumerable<IFeedParser> _parsers = parsers;
    private readonly HttpClient _httpClient = httpClient;
    private readonly ILogger<FeedAggregationService> _logger = logger;
    private readonly ISystemEventService _eventService = eventService;

    public async Task AggregateAllFeedsAsync(CancellationToken ct = default)
    {
        List<FeedSource> sources;
        await using (var context = await _contextFactory.CreateDbContextAsync(ct))
        {
            sources = await context.FeedSources.Where(s => s.IsActive).ToListAsync(ct);
        }

        foreach (var source in sources)
        {
            try
            {
                await AggregateSourceAsync(source.Id, ct);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to aggregate feed source {Name}", source.Name);
                await _eventService.LogErrorAsync(nameof(FeedAggregationService), $"Feed aggregation failed for {source.Name}: {ex.Message}", ex);
            }
        }
    }

    public async Task AggregateSourceAsync(Guid sourceId, CancellationToken ct = default)
    {
        FeedSource? source;
        await using (var context = await _contextFactory.CreateDbContextAsync(ct))
        {
            source = await context.FeedSources.SingleOrDefaultAsync(s => s.Id == sourceId, ct);
        }

        if (source == null || !source.IsActive) return;

        try
        {
            var parser = _parsers.FirstOrDefault(p => p.CanParse(source.Url));
            if (parser == null)
            {
                throw new NotSupportedException($"No registered parser could parse the URL: {source.Url}");
            }

            var items = await parser.ParseAsync(source, _httpClient, ct);
            if (items.Count > 0)
            {
                await using var context = await _contextFactory.CreateDbContextAsync(ct);

                var uniqueItems = items
                    .Where(item => !string.IsNullOrWhiteSpace(item.Link))
                    .Select(item =>
                    {
                        item.Link = NormalizeFeedLink(item.Link);
                        return item;
                    })
                    .GroupBy(item => item.Link, StringComparer.OrdinalIgnoreCase)
                    .Select(group => group.First())
                    .ToList();

                foreach (var item in uniqueItems)
                {
                    await context.Database.ExecuteSqlInterpolatedAsync($"""
                        INSERT INTO feed_item (
                            id,
                            author,
                            content,
                            feed_source_id,
                            image_url,
                            link,
                            publish_date,
                            title
                        )
                        VALUES (
                            {item.Id},
                            {item.Author},
                            {item.Content},
                            {item.FeedSourceId},
                            {item.ImageUrl},
                            {item.Link},
                            {item.PublishDate},
                            {item.Title}
                        )
                        ON CONFLICT (link) DO NOTHING
                        """, ct);
                }
            }

            await using (var context = await _contextFactory.CreateDbContextAsync(ct))
            {
                var src = await context.FeedSources.SingleAsync(s => s.Id == sourceId, ct);
                src.LastPolledAt = DateTime.UtcNow;
                src.LastSuccessAt = DateTime.UtcNow;
                src.LastSyncError = null;
                await context.SaveChangesAsync(ct);
            }
        }
        catch (Exception ex)
        {
            await using (var context = await _contextFactory.CreateDbContextAsync(ct))
            {
                var src = await context.FeedSources.SingleAsync(s => s.Id == sourceId, ct);
                src.LastPolledAt = DateTime.UtcNow;
                src.LastSyncError = ex.Message;
                await context.SaveChangesAsync(ct);
            }
            await _eventService.LogErrorAsync(nameof(FeedAggregationService), $"Feed aggregation failed for {source.Name}: {ex.Message}", ex);
        }
    }

    private static string NormalizeFeedLink(string link)
    {
        var normalized = link.Trim();

        if (Uri.TryCreate(normalized, UriKind.Absolute, out var uri))
        {
            var builder = new UriBuilder(uri)
            {
                Fragment = string.Empty
            };

            normalized = builder.Uri.ToString();
        }

        return normalized.TrimEnd('/');
    }
}
