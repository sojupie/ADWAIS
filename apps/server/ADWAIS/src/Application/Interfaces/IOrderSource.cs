using Adwais.Application.DTOs.Financial.Upstream;

namespace Adwais.Application.Interfaces;

public interface IOrderSource
{
    string Provider { get; }

    Task<IReadOnlyList<OrderSourceOrder>> FetchOrdersAsync(
        OrderSourceSettings settings,
        DateTimeOffset startDate,
        DateTimeOffset endDate,
        int take,
        CancellationToken ct = default);
}
