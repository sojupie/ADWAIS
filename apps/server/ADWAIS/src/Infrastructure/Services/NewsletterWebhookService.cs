using System;
using System.Threading;
using System.Threading.Tasks;
using Adwais.Application.DTOs.Intranet;
using Adwais.Application.Interfaces;
using Adwais.Domain.Entities.Intranet;
using Adwais.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Adwais.Infrastructure.Services;

public class NewsletterWebhookService(IDbContextFactory<AnalyticsDbContext> dbContextFactory) : INewsletterWebhookService
{
    private readonly IDbContextFactory<AnalyticsDbContext> _dbContextFactory = dbContextFactory;

    public async Task<Guid> IngestNewsletterAsync(CreateNewsletterDto dto, CancellationToken ct = default)
    {
        await using var db = await _dbContextFactory.CreateDbContextAsync(ct);

        var newsletter = new Newsletter
        {
            Id = Guid.NewGuid(),
            Title = dto.Title,
            Body = dto.Body,
            Category = dto.Category,
            CreatedAt = DateTime.UtcNow
        };

        db.Newsletters.Add(newsletter);
        await db.SaveChangesAsync(ct);

        return newsletter.Id;
    }
}
