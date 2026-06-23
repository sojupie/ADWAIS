using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.ServiceModel.Syndication;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;
using System.Xml;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using HtmlAgilityPack;
using Adwais.Application.Interfaces;
using Adwais.Domain.Entities;
using Adwais.Domain.Entities.Intranet;
using Adwais.Domain.Enums;
using Adwais.Infrastructure.Persistence;

namespace Adwais.Infrastructure.Services;

public partial class FeedAggregationService(
    IDbContextFactory<AnalyticsDbContext> contextFactory,
    HttpClient httpClient,
    ILogger<FeedAggregationService> logger,
    ISystemEventService eventService)
    : IFeedAggregationService
{
    private readonly IDbContextFactory<AnalyticsDbContext> _contextFactory = contextFactory;
    private readonly HttpClient _httpClient = httpClient;
    private readonly ILogger<FeedAggregationService> _logger = logger;
    private readonly ISystemEventService _eventService = eventService;

    [GeneratedRegex(@"url\(['""']?(.*?)['""']?\)")]
    private static partial Regex BackgroundImageUrlRegex();

    public async Task AggregateAllFeedsAsync(CancellationToken ct = default)
    {
        List<FeedSource> sources;
        await using (var context = await _contextFactory.CreateDbContextAsync(ct))
        {
            sources = await context.FeedSources
                .Where(s => s.IsActive)
                .ToListAsync(ct);
        }

        _logger.LogInformation("Starting aggregation for {Count} active feed sources.", sources.Count);

        foreach (var source in sources)
        {
            try
            {
                await AggregateSourceAsync(source.Id, ct);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to aggregate feed source {Name} ({Id}).", source.Name, source.Id);
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

        if (source == null || !source.IsActive)
        {
            _logger.LogWarning("Feed source {Id} not found or inactive.", sourceId);
            return;
        }

        _logger.LogInformation("Aggregating source: {Name} ({Url})", source.Name, source.Url);

        var items = new List<FeedItem>();

        if (source.Url.Contains("format=rss") || source.Url.EndsWith(".xml") || source.Url.Contains("/rss"))
        {
            items = await ParseRssFeedAsync(source, ct);
        }
        else if (source.Url.Contains("litium.com"))
        {
            items = await ScrapeLitiumBlogAsync(source, ct);
        }
        else if (source.Url.Contains("motillo.com"))
        {
            items = await ScrapeMotilloAktuelltAsync(source, ct);
        }
        else
        {
            throw new NotSupportedException($"Feed URL style is not supported for automatic parsing: {source.Url}");
        }

        if (items.Count > 0)
        {
            await SaveFeedItemsAsync(sourceId, items, ct);
        }

        await using (var context = await _contextFactory.CreateDbContextAsync(ct))
        {
            var src = await context.FeedSources.SingleAsync(s => s.Id == sourceId, ct);
            src.LastPolledAt = DateTime.UtcNow;
            await context.SaveChangesAsync(ct);
        }

        _logger.LogInformation("Completed aggregation for {Name}. Stored/Checked {Count} items.", source.Name, items.Count);
    }

    private async Task<List<FeedItem>> ParseRssFeedAsync(FeedSource source, CancellationToken ct)
    {
        var items = new List<FeedItem>();
        var response = await _httpClient.GetAsync(source.Url, ct);
        response.EnsureSuccessStatusCode();

        using var responseStream = await response.Content.ReadAsStreamAsync(ct);
        using var xmlReader = XmlReader.Create(responseStream);
        var syndicationFeed = SyndicationFeed.Load(xmlReader);

        if (syndicationFeed != null)
        {
            foreach (var syndicationItem in syndicationFeed.Items)
            {
                var link = syndicationItem.Links.FirstOrDefault()?.Uri?.ToString() ?? syndicationItem.Id;
                if (string.IsNullOrEmpty(link)) continue;

                var title = syndicationItem.Title?.Text ?? "Untitled";
                var content = syndicationItem.Summary?.Text ?? syndicationItem.Content?.ToString();
                
                // Pull author details
                var author = syndicationItem.Authors.FirstOrDefault()?.Name 
                             ?? syndicationItem.Authors.FirstOrDefault()?.Email 
                             ?? source.Name;

                // Extract image enclosure or check summary html
                var imageUrl = syndicationItem.Links
                    .FirstOrDefault(l => l.RelationshipType == "enclosure" && l.MediaType != null && l.MediaType.StartsWith("image/"))?
                    .Uri?.ToString();

                if (string.IsNullOrEmpty(imageUrl) && !string.IsNullOrEmpty(content))
                {
                    imageUrl = ExtractFirstImgSrc(content);
                }

                items.Add(new FeedItem
                {
                    Id = Guid.NewGuid(),
                    FeedSourceId = source.Id,
                    Title = title,
                    Content = content,
                    Link = link,
                    PublishDate = syndicationItem.PublishDate.UtcDateTime,
                    Author = author,
                    ImageUrl = imageUrl
                });
            }
        }

        return items;
    }

    private async Task<List<FeedItem>> ScrapeLitiumBlogAsync(FeedSource source, CancellationToken ct)
    {
        var items = new List<FeedItem>();
        var response = await _httpClient.GetAsync(source.Url, ct);
        response.EnsureSuccessStatusCode();

        var htmlContent = await response.Content.ReadAsStringAsync(ct);
        var htmlDoc = new HtmlDocument();
        htmlDoc.LoadHtml(htmlContent);

        var articleNodes = htmlDoc.DocumentNode.SelectNodes("//article[contains(@class, 'blog-index-container')]");
        if (articleNodes == null)
        {
            _logger.LogWarning("No article elements found on Litium blog page.");
            return items;
        }

        foreach (var node in articleNodes)
        {
            var titleNode = node.SelectSingleNode(".//h3[contains(@class, 'heading-m')]") 
                            ?? node.SelectSingleNode(".//h3")
                            ?? node.SelectSingleNode(".//a[contains(@class, 'blog-index-link')]");
            var title = titleNode?.InnerText?.Trim() ?? "Untitled";

            var linkNode = node.SelectSingleNode(".//a[contains(@class, 'blog-index-link')]") 
                           ?? node.SelectSingleNode(".//a");
            var link = linkNode?.GetAttributeValue("href", null);
            if (string.IsNullOrEmpty(link)) continue;

            // Resolve relative links
            if (link.StartsWith('/'))
            {
                link = "https://www.litium.com" + link;
            }

            var dateNode = node.SelectSingleNode(".//span[contains(@class, 'publish-date')]");
            var date = DateTime.UtcNow;
            if (dateNode != null && DateTime.TryParseExact(dateNode.InnerText.Trim(), "dd/MM/yyyy", CultureInfo.InvariantCulture, DateTimeStyles.AssumeUniversal, out var parsedDate))
            {
                date = parsedDate.ToUniversalTime();
            }

            // Image from background style
            var imageContainer = node.SelectSingleNode(".//div[contains(@class, 'blog-item-top-container')]");
            string? imageUrl = null;
            if (imageContainer != null)
            {
                var style = imageContainer.GetAttributeValue("style", "");
                var match = BackgroundImageUrlRegex().Match(style);
                if (match.Success)
                {
                    imageUrl = match.Groups[1].Value.Trim('\'', '"');
                }
            }

            items.Add(new FeedItem
            {
                Id = Guid.NewGuid(),
                FeedSourceId = source.Id,
                Title = title,
                Content = title, // Fallback since summary isn't rendered directly in the grid
                Link = link,
                PublishDate = date,
                Author = "Litium",
                ImageUrl = imageUrl
            });
        }

        return items;
    }

    private async Task<List<FeedItem>> ScrapeMotilloAktuelltAsync(FeedSource source, CancellationToken ct)
    {
        var items = new List<FeedItem>();
        var response = await _httpClient.GetAsync(source.Url, ct);
        response.EnsureSuccessStatusCode();

        var htmlContent = await response.Content.ReadAsStringAsync(ct);
        var htmlDoc = new HtmlDocument();
        htmlDoc.LoadHtml(htmlContent);

        // Find main grid items (anchors acting as grid cards)
        var cardNodes = htmlDoc.DocumentNode.SelectNodes("//section//div[contains(@class, 'grid')]//a[contains(@class, 'group')]")
                        ?? htmlDoc.DocumentNode.SelectNodes("//a[contains(@class, 'group') and contains(@href, '/aktuellt/')]");
        if (cardNodes == null)
        {
            _logger.LogWarning("No article grid cards found on Motillo page.");
            return items;
        }

        foreach (var node in cardNodes)
        {
            var link = node.GetAttributeValue("href", null);
            if (string.IsNullOrEmpty(link)) continue;

            if (link.StartsWith('/'))
            {
                link = "https://www.motillo.com" + link;
            }

            var titleNode = node.SelectSingleNode(".//h3");
            var title = titleNode?.InnerText?.Trim() ?? "Untitled";

            var contentNode = node.SelectSingleNode(".//p");
            var content = contentNode?.InnerText?.Trim() ?? "";

            // Find image
            var imgNode = node.SelectSingleNode(".//img");
            var imageUrl = imgNode?.GetAttributeValue("src", null);
            if (!string.IsNullOrEmpty(imageUrl) && imageUrl.StartsWith('/'))
            {
                imageUrl = "https://www.motillo.com" + imageUrl;
            }

            // Motillo uses date grouping, if unavailable fallback to current time
            var date = DateTime.UtcNow;

            items.Add(new FeedItem
            {
                Id = Guid.NewGuid(),
                FeedSourceId = source.Id,
                Title = title,
                Content = content,
                Link = link,
                PublishDate = date,
                Author = "Motillo",
                ImageUrl = imageUrl
            });
        }

        return items;
    }

    private async Task SaveFeedItemsAsync(Guid sourceId, List<FeedItem> items, CancellationToken ct)
    {
        await using var context = await _contextFactory.CreateDbContextAsync(ct);

        foreach (var item in items)
        {
            // Verify link uniqueness to prevent unique key constraint crashes
            var exists = await context.FeedItems.AnyAsync(fi => fi.Link == item.Link, ct);
            if (exists) continue;

            context.FeedItems.Add(item);
        }

        await context.SaveChangesAsync(ct);
    }

    private static string? ExtractFirstImgSrc(string html)
    {
        var match = Regex.Match(html, @"<img\s+[^>]*src=[""']([^""']+)[""']", RegexOptions.IgnoreCase);
        return match.Success ? match.Groups[1].Value : null;
    }
}
