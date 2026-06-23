using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Adwais.Domain.Entities.Intranet;

namespace Adwais.Application.Interfaces;

public interface INewsletterService
{
    Task<IEnumerable<Newsletter>> GetNewslettersAsync(string? category, CancellationToken ct = default);
}
