using Adwais.Domain.Entities;

namespace Adwais.Application.Interfaces;

public interface ILitiumIngestionService
{
    Task<int> ExecuteIngestionAsync(TenantId tenantId, DateTimeOffset startDate, DateTimeOffset endDate, CancellationToken ct = default);
}
