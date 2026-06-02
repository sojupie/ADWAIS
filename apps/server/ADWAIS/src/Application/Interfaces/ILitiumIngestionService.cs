using Adwais.Domain.Entities;

namespace Adwais.Application.Interfaces;

public interface ILitiumIngestionService
{
    Task<int> ExecuteIngestionAsync(Guid tenantId, DateTimeOffset startDate, DateTimeOffset endDate, CancellationToken ct = default);
}
