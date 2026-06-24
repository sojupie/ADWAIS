using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using Adwais.Api.Controllers;
using Adwais.Application.DTOs.Intranet;
using Adwais.Application.DTOs.System;
using Adwais.Application.Interfaces;
using Adwais.Domain.Entities.Intranet;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace Adwais.Tests.Controllers;

public class IntranetControllerTests
{
    private readonly Mock<ISystemHealthService> _healthServiceMock;
    private readonly SystemHealthController _controller;

    public IntranetControllerTests()
    {
        _healthServiceMock = new Mock<ISystemHealthService>();
        _controller = new SystemHealthController(_healthServiceMock.Object);
    }

    [Fact]
    public async Task GetHealth_ShouldReturnOkWithSystemHealthDto()
    {
        // Arrange
        var healthDto = new SystemHealthDto(
            DatabaseStatus: "Healthy",
            Hangfire: new HangfireHealthDto("Healthy", 0, 0, 0, 0),
            Sync: new SyncHealthDto("Healthy", 0, 0, 0, null),
            LastLitiumSync: null,
            LastBlogSync: null,
            LastFleetUpdate: null,
            LastFleetUptimeUpdate: null,
            LastFleetLatencyUpdate: null
        );

        _healthServiceMock.Setup(s => s.GetHealthAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(healthDto);

        // Act
        var result = await _controller.GetHealth();

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var returnedHealth = Assert.IsType<SystemHealthDto>(okResult.Value);
        Assert.Equal("Healthy", returnedHealth.DatabaseStatus);
        _healthServiceMock.Verify(s => s.GetHealthAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task ClearErrors_ShouldReturnNoContent()
    {
        // Arrange & Act
        var result = await _controller.ClearErrors();

        // Assert
        Assert.IsType<NoContentResult>(result);
        _healthServiceMock.Verify(s => s.ClearErrorsAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Webhooks_ReceiveNewsletter_ShouldReturnOk_AndSaveToDb_WhenApiKeyIsValid()
    {
        // Arrange
        var configMock = new Mock<IConfiguration>();
        configMock.Setup(c => c["Webhooks:NewsletterApiKey"]).Returns("valid-secret-key");

        var newsletterId = Guid.NewGuid();
        var webhookServiceMock = new Mock<INewsletterWebhookService>();
        webhookServiceMock.Setup(s => s.IngestNewsletterAsync(It.IsAny<CreateNewsletterDto>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(newsletterId);

        var controller = new WebhooksController(
            new Mock<ILitiumIngestionService>().Object,
            configMock.Object,
            new Mock<ILogger<WebhooksController>>().Object,
            webhookServiceMock.Object);

        var payload = new CreateNewsletterDto { Title = "Weekly News", Body = "Content", Category = "General" };

        var httpContext = new DefaultHttpContext();
        httpContext.Request.Headers["X-Api-Key"] = "valid-secret-key";
        controller.ControllerContext = new ControllerContext { HttpContext = httpContext };

        // Act
        var result = await controller.ReceiveNewsletter(payload, CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var returnedData = okResult.Value;
        Assert.NotNull(returnedData);
        webhookServiceMock.Verify(s => s.IngestNewsletterAsync(payload, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Webhooks_ReceiveNewsletter_ShouldReturnUnauthorized_WhenApiKeyIsInvalid()
    {
        // Arrange
        var configMock = new Mock<IConfiguration>();
        configMock.Setup(c => c["Webhooks:NewsletterApiKey"]).Returns("valid-secret-key");

        var webhookServiceMock = new Mock<INewsletterWebhookService>();
        var controller = new WebhooksController(
            new Mock<ILitiumIngestionService>().Object,
            configMock.Object,
            new Mock<ILogger<WebhooksController>>().Object,
            webhookServiceMock.Object);

        var payload = new CreateNewsletterDto { Title = "Weekly News", Body = "Content", Category = "General" };
        var httpContext = new DefaultHttpContext();
        httpContext.Request.Headers["X-Api-Key"] = "wrong-key";
        controller.ControllerContext = new ControllerContext { HttpContext = httpContext };

        // Act
        var result = await controller.ReceiveNewsletter(payload, CancellationToken.None);

        // Assert
        Assert.IsType<UnauthorizedResult>(result);
    }

    [Fact]
    public async Task Posts_CreatePost_ShouldReturnCreated_AndSaveToDb()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var post = new CommunityPost
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Title = "Announcing Intranet",
            Body = "Exciting news!",
            CreatedAt = DateTime.UtcNow
        };

        var postServiceMock = new Mock<ICommunityPostService>();
        postServiceMock.Setup(s => s.CreatePostAsync(userId, "Announcing Intranet", "Exciting news!", It.IsAny<CancellationToken>()))
            .ReturnsAsync(post);

        var controller = new CommunityPostController(postServiceMock.Object);
        
        var claims = new List<Claim> { new(ClaimTypes.NameIdentifier, userId.ToString()) };
        var identity = new ClaimsIdentity(claims, "TestAuth");
        controller.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal(identity) } };

        var dto = new CreatePostDto { Title = "Announcing Intranet", Body = "Exciting news!" };

        // Act
        var result = await controller.CreatePost(dto, CancellationToken.None);

        // Assert
        var createdResult = Assert.IsType<CreatedAtActionResult>(result);
        var returned = Assert.IsType<CommunityPost>(createdResult.Value);
        Assert.Equal(userId, returned.UserId);
        Assert.Equal("Announcing Intranet", returned.Title);
        postServiceMock.Verify(s => s.CreatePostAsync(userId, "Announcing Intranet", "Exciting news!", It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Posts_CreatePost_ShouldReturnUnauthorized_WhenUserContextIsInvalid()
    {
        // Arrange
        var postServiceMock = new Mock<ICommunityPostService>();
        var controller = new CommunityPostController(postServiceMock.Object);
        
        var claims = new List<Claim>(); // No claims
        var identity = new ClaimsIdentity(claims, "TestAuth");
        controller.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal(identity) } };

        var dto = new CreatePostDto { Title = "Announcing Intranet", Body = "Exciting news!" };

        // Act
        var result = await controller.CreatePost(dto, CancellationToken.None);

        // Assert
        Assert.IsType<UnauthorizedObjectResult>(result);
    }

    [Fact]
    public async Task Posts_GetPosts_ShouldReturnOkWithList()
    {
        // Arrange
        var posts = new List<CommunityPost>
        {
            new() { Id = Guid.NewGuid(), Title = "Post 1", Body = "Body 1", CreatedAt = DateTime.UtcNow }
        };
        var postServiceMock = new Mock<ICommunityPostService>();
        postServiceMock.Setup(s => s.GetPostsAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(posts);

        var controller = new CommunityPostController(postServiceMock.Object);

        // Act
        var result = await controller.GetPosts(CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var returned = Assert.IsType<List<CommunityPost>>(okResult.Value);
        Assert.Single(returned);
        postServiceMock.Verify(s => s.GetPostsAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task FeedController_GetFeeds_ShouldReturnOkWithList()
    {
        // Arrange
        var feeds = new List<FeedItem>
        {
            new() { Id = Guid.NewGuid(), Title = "Feed 1", Link = "https://link" }
        };
        var feedServiceMock = new Mock<IFeedService>();
        feedServiceMock.Setup(s => s.GetFeedsAsync(It.IsAny<GetFeedsRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(feeds);

        var controller = new FeedController(feedServiceMock.Object);

        // Act
        var result = await controller.GetFeeds(new GetFeedsRequest { FeedSourceId = null, Page = 1, PageSize = 10 }, CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var returned = Assert.IsType<List<FeedItem>>(okResult.Value);
        Assert.Single(returned);
        feedServiceMock.Verify(s => s.GetFeedsAsync(It.Is<GetFeedsRequest>(r => r.FeedSourceId == null && r.Page == 1 && r.PageSize == 10), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task NewsletterController_GetNewsletters_ShouldReturnOkWithList()
    {
        // Arrange
        var newsletters = new List<Newsletter>
        {
            new() { Id = Guid.NewGuid(), Title = "Newsletter 1", Body = "Body 1", Category = "General", CreatedAt = DateTime.UtcNow }
        };
        var newsletterServiceMock = new Mock<INewsletterService>();
        newsletterServiceMock.Setup(s => s.GetNewslettersAsync("General", It.IsAny<CancellationToken>()))
            .ReturnsAsync(newsletters);

        var controller = new NewsletterController(newsletterServiceMock.Object);

        // Act
        var result = await controller.GetNewsletters("General", CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var returned = Assert.IsType<List<Newsletter>>(okResult.Value);
        Assert.Single(returned);
        newsletterServiceMock.Verify(s => s.GetNewslettersAsync("General", It.IsAny<CancellationToken>()), Times.Once);
    }
}
