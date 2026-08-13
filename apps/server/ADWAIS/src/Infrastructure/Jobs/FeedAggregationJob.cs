// Part of the ADWAIS project, under the Business Source License 1.1.
// See /LICENSE for license information.
// SPDX-License-Identifier: BUSL-1.1

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
