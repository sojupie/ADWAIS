using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using Adwais.Application.Interfaces;
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

    public Task AggregateAllFeedsAsync(CancellationToken ct = default) => Task.CompletedTask;
    public Task AggregateSourceAsync(Guid sourceId, CancellationToken ct = default) => Task.CompletedTask;
}
