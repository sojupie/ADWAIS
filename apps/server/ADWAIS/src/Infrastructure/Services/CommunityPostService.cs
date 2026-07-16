using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Adwais.Application.Common.Interfaces;
using Adwais.Application.Interfaces;
using Adwais.Domain.Entities.Intranet;
using Microsoft.EntityFrameworkCore;

namespace Adwais.Infrastructure.Services;

public class CommunityPostService(IApplicationDbContext dbContext) : ICommunityPostService
{
    private readonly IApplicationDbContext _dbContext = dbContext;

    public async Task<CommunityPost?> GetPostByIdAsync(Guid id, CancellationToken ct = default)
    {
        var post = await _dbContext.CommunityPosts.FindAsync(new object[] { id }, ct);
        if (post != null)
        {
            post.User = await _dbContext.Users.SingleOrDefaultAsync(user => user.Id == post.UserId, ct);
        }

        return post;
    }

    public async Task<CommunityPost> CreatePostAsync(Guid userId, string title, string body, CancellationToken ct = default)
    {
        var post = new CommunityPost
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Title = title,
            Body = body,
            CreatedAt = DateTime.UtcNow
        };
        _dbContext.CommunityPosts.Add(post);
        await _dbContext.SaveChangesAsync(ct);

        return await GetPostByIdAsync(post.Id, ct) ?? post;
    }

    public async Task<IEnumerable<CommunityPost>> GetPostsAsync(CancellationToken ct = default)
    {
        return await _dbContext.CommunityPosts
            .Include(p => p.User)
            .AsNoTracking()
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync(ct);
    }

    public async Task<CommunityPost?> UpdatePostAsync(
        Guid id,
        string? title,
        string? body,
        CancellationToken ct = default)
    {
        var post = await _dbContext.CommunityPosts.SingleOrDefaultAsync(p => p.Id == id, ct);
        if (post == null) return null;

        if (title != null) post.Title = title;
        if (body != null) post.Body = body;
        post.UpdatedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync(ct);
        return await GetPostByIdAsync(post.Id, ct) ?? post;
    }

    public async Task<bool> DeletePostAsync(Guid id, CancellationToken ct = default)
    {
        var post = await _dbContext.CommunityPosts.SingleOrDefaultAsync(p => p.Id == id, ct);
        if (post == null) return false;

        _dbContext.CommunityPosts.Remove(post);
        await _dbContext.SaveChangesAsync(ct);
        return true;
    }
}
