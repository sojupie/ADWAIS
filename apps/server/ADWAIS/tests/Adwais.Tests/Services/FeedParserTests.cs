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

    [Fact]
    public async Task LitiumBlogParser_CanParse_LitiumBlog_AndScrapesItems()
    {
        // Arrange
        var parser = new LitiumBlogParser();
        var source = new FeedSource { Id = Guid.NewGuid(), Name = "Litium Blog", Url = "https://www.litium.com/blog", IsActive = true };
        
        var html = @"
        <html>
          <body>
            <article class=""blog-index-container"">
              <a class=""blog-index-link"" href=""/blog/customer-pricing"">
                <div class=""blog-item-top-container"" style=""background-image: url(https://litium.com/image.jpg);""></div>
              </a>
              <h3>Customer Pricing</h3>
              <span class=""publish-date"">23/06/2026</span>
            </article>
          </body>
        </html>";
        var handler = new MockHttpMessageHandler(req => new HttpResponseMessage(HttpStatusCode.OK) { Content = new StringContent(html, Encoding.UTF8, "text/html") });
        var client = new HttpClient(handler);

        // Act & Assert
        Assert.True(parser.CanParse(source.Url));
        var items = await parser.ParseAsync(source, client, CancellationToken.None);
        var item = Assert.Single(items);
        Assert.Equal("Customer Pricing", item.Title);
        Assert.Equal("https://www.litium.com/blog/customer-pricing", item.Link);
        Assert.Equal("https://litium.com/image.jpg", item.ImageUrl);
    }
}
