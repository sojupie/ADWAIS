using System;
using System.Collections.Generic;
using System.Net;
using System.Net.Http;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Adwais.Domain.Entities.Intranet;
using Adwais.Infrastructure.Services.Parsers;
using Xunit;

namespace Adwais.Tests.Services;

public class MockHttpMessageHandler(Func<HttpRequestMessage, HttpResponseMessage> sendFunc) : HttpMessageHandler
{
    private readonly Func<HttpRequestMessage, HttpResponseMessage> _sendFunc = sendFunc;

    protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
    {
        return Task.FromResult(_sendFunc(request));
    }
}

public class FeedParserTests
{
    [Fact]
    public async Task RssFeedParser_CanParse_RssUrl_AndExtractsItems()
    {
        // Arrange
        var parser = new RssFeedParser();
        var source = new FeedSource { Id = Guid.NewGuid(), Name = "RSS", Url = "https://news.cision.com/rss", IsActive = true };
        
        var rssXml = @"<?xml version=""1.0"" encoding=""utf-8""?>
        <rss version=""2.0"">
          <channel>
            <item>
              <title>Test RSS Title</title>
              <link>https://news.cision.com/rss-test</link>
              <pubDate>Tue, 23 Jun 2026 12:00:00 GMT</pubDate>
              <description>RSS description</description>
            </item>
          </channel>
        </rss>";
        var handler = new MockHttpMessageHandler(req => new HttpResponseMessage(HttpStatusCode.OK) { Content = new StringContent(rssXml, Encoding.UTF8, "application/xml") });
        var client = new HttpClient(handler);

        // Act & Assert
        Assert.True(parser.CanParse(source.Url));
        var items = await parser.ParseAsync(source, client, CancellationToken.None);
        var item = Assert.Single(items);
        Assert.Equal("Test RSS Title", item.Title);
        Assert.Equal("https://news.cision.com/rss-test", item.Link);
    }
}
