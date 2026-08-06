using System;
using System.Threading;
using System.Threading.Tasks;

namespace Adwais.Application.Interfaces;

public interface ICalendarFeedService
{
    Task<string> GetUserCalendarFeedTokenAsync(Guid userId, CancellationToken ct = default);
    Task<string> RegenerateUserCalendarFeedTokenAsync(Guid userId, CancellationToken ct = default);
    Task<byte[]> GenerateIcsFeedAsync(string feedToken, CancellationToken ct = default);
}
