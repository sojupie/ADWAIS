using System;
using System.Threading;
using System.Threading.Tasks;

namespace Adwais.Application.Interfaces;

public interface IFeedAggregationService
{
    Task AggregateAllFeedsAsync(CancellationToken ct = default);
    Task AggregateSourceAsync(Guid sourceId, CancellationToken ct = default);
}
