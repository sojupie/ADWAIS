using System;
using System.Threading;
using System.Threading.Tasks;
using Adwais.Application.DTOs.Intranet;

namespace Adwais.Application.Interfaces;

public interface INewsletterWebhookService
{
    Task<Guid> IngestNewsletterAsync(CreateNewsletterDto dto, CancellationToken ct = default);
}
