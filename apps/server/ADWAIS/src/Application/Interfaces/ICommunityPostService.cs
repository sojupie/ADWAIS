using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Adwais.Domain.Entities.Intranet;

namespace Adwais.Application.Interfaces;

public interface ICommunityPostService
{
    Task<CommunityPost?> GetPostByIdAsync(Guid id, CancellationToken ct = default);
    Task<CommunityPost> CreatePostAsync(Guid userId, string title, string body, CancellationToken ct = default);
    Task<IEnumerable<CommunityPost>> GetPostsAsync(CancellationToken ct = default);
}
