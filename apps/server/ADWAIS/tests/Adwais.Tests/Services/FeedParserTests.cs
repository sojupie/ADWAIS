using System;
using System.Net;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
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
