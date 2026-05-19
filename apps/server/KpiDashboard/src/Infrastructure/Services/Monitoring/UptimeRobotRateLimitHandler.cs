using System.Net;
using Infrastructure.CacheModels;
using Microsoft.Extensions.Caching.Memory;

namespace Infrastructure.Services.Monitoring;

public class UptimeRobotRateLimitHandler(IMemoryCache cache) : DelegatingHandler
{
    private const string RateLimitKey = GlobalCacheKeys.UptimeRobotRateLimit;
    private static readonly SemaphoreSlim Semaphore = new(1, 1);

    protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
    {
        await Semaphore.WaitAsync(cancellationToken);
        try
        {
            if (cache.TryGetValue<DateTimeOffset>(RateLimitKey, out var resetTime))
            {
                var delay = resetTime - DateTimeOffset.UtcNow;
                if (delay > TimeSpan.Zero)
                {
                    await Task.Delay(delay, cancellationToken);
                }
            }
        }
        finally
        {
            Semaphore.Release();
        }

        var response = await base.SendAsync(request, cancellationToken);

        if (response.Headers.TryGetValues("X-RateLimit-Remaining", out var remainingVals) &&
            int.TryParse(remainingVals.FirstOrDefault(), out var remaining))
        {
            if (remaining == 0 && response.Headers.TryGetValues("X-RateLimit-Reset", out var resetVals) &&
                long.TryParse(resetVals.FirstOrDefault(), out var resetEpoch))
            {
                var resetDate = DateTimeOffset.FromUnixTimeSeconds(resetEpoch);
                cache.Set(RateLimitKey, resetDate, resetDate);
            }
        }
        else if (response.StatusCode == HttpStatusCode.TooManyRequests)
        {
            // Fallback if headers are missing but 429 is returned
            var delay = TimeSpan.FromMinutes(1);
            if (response.Headers.TryGetValues("Retry-After", out var retryVals) &&
                int.TryParse(retryVals.FirstOrDefault(), out var retrySeconds))
            {
                delay = TimeSpan.FromSeconds(retrySeconds);
            }
            cache.Set(RateLimitKey, DateTimeOffset.UtcNow.Add(delay), delay);
            throw new HttpRequestException("UptimeRobot rate limit exceeded. Retry after delay.", null, HttpStatusCode.TooManyRequests);
        }

        return response;
    }
}
