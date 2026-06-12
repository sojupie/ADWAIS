using Adwais.Domain.Entities;
using Adwais.Application.DTOs.Financial.Upstream;

namespace Adwais.Application.Interfaces;

public interface ILitiumIngestionService
{
    Task<int> ExecuteIngestionAsync(Guid tenantId, DateTimeOffset startDate, DateTimeOffset endDate, CancellationToken ct = default);
    Task IngestSingleOrderAsync(Guid tenantId, LitiumSyncResponse.LitiumOrderDto order, CancellationToken ct = default);
}
