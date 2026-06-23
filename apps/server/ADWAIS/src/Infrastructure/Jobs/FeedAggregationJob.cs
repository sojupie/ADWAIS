using System.Threading;
using System.Threading.Tasks;
using Adwais.Application.Interfaces;
using Hangfire;

namespace Adwais.Infrastructure.Jobs;

public class FeedAggregationJob(IFeedAggregationService feedAggregationService)
{
    private readonly IFeedAggregationService _feedAggregationService = feedAggregationService;

    [Queue("default")]
    [AutomaticRetry(Attempts = 2, LogEvents = true)]
    public async Task ExecuteAsync(CancellationToken ct)
    {
        await _feedAggregationService.AggregateAllFeedsAsync(ct);
    }
}
