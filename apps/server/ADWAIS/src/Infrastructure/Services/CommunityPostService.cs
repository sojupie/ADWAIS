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
        return await _dbContext.CommunityPosts.FindAsync(new object[] { id }, ct);
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
        return post;
    }

    public async Task<IEnumerable<CommunityPost>> GetPostsAsync(CancellationToken ct = default)
    {
        return await _dbContext.CommunityPosts
            .Include(p => p.User)
            .AsNoTracking()
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync(ct);
    }
}
