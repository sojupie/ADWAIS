using System;
using System.Threading;
using System.Threading.Tasks;
using Adwais.Application.Interfaces;
using Adwais.Domain.Entities.Intranet;
using Adwais.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Adwais.Infrastructure.Services;

public class CommunityPostService(IDbContextFactory<AnalyticsDbContext> dbContextFactory) : ICommunityPostService
{
    private readonly IDbContextFactory<AnalyticsDbContext> _dbContextFactory = dbContextFactory;

    public async Task<CommunityPost?> GetPostByIdAsync(Guid id, CancellationToken ct = default)
    {
        await using var db = await _dbContextFactory.CreateDbContextAsync(ct);
        return await db.CommunityPosts.FindAsync(new object[] { id }, ct);
    }

    public async Task<CommunityPost> CreatePostAsync(Guid userId, string title, string body, CancellationToken ct = default)
    {
        await using var db = await _dbContextFactory.CreateDbContextAsync(ct);
        var post = new CommunityPost
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Title = title,
            Body = body,
            CreatedAt = DateTime.UtcNow
        };
        db.CommunityPosts.Add(post);
        await db.SaveChangesAsync(ct);
        return post;
    }
}
