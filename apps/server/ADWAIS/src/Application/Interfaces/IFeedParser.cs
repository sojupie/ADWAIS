using System.Collections.Generic;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using Adwais.Domain.Entities.Intranet;

namespace Adwais.Application.Interfaces;

public interface IFeedParser
{
    bool CanParse(string url);
    Task<List<FeedItem>> ParseAsync(FeedSource source, HttpClient httpClient, CancellationToken ct);
}
