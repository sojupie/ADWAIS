using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Adwais.Application.Interfaces;
using Adwais.Domain.Entities.Intranet;
using Adwais.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Adwais.Infrastructure.Services;

public class NewsletterService(IDbContextFactory<AnalyticsDbContext> dbContextFactory) : INewsletterService
{
    private readonly IDbContextFactory<AnalyticsDbContext> _dbContextFactory = dbContextFactory;

    public async Task<IEnumerable<Newsletter>> GetNewslettersAsync(string? category, CancellationToken ct = default)
    {
        await using var db = await _dbContextFactory.CreateDbContextAsync(ct);

        var query = db.Newsletters.AsNoTracking();

        if (!string.IsNullOrEmpty(category))
        {
            query = query.Where(n => n.Category == category);
        }

        return await query
            .OrderByDescending(n => n.CreatedAt)
            .ToListAsync(ct);
    }
}
