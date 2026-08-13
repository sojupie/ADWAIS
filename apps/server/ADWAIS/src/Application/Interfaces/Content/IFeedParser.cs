// Part of the ADWAIS project, under the Business Source License 1.1.
// See /LICENSE for license information.
// SPDX-License-Identifier: BUSL-1.1

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
