using System.Text.Json;
using Adwais.Application.DTOs.Financial.Upstream;
using Adwais.Application.Interfaces;
using Adwais.Domain.Enums;

namespace Adwais.Infrastructure.Services;

public sealed class LitiumOrderSource(HttpClient httpClient) : IOrderSource
{
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };

    public string Provider => "litium";

    public async Task<IReadOnlyList<OrderSourceOrder>> FetchOrdersAsync(
        OrderSourceSettings settings,
        DateTimeOffset startDate,
        DateTimeOffset endDate,
        int take,
        CancellationToken ct = default)
    {
        var since = Uri.EscapeDataString(startDate.ToString("O"));
        var until = Uri.EscapeDataString(endDate.ToString("O"));
        var url = $"{settings.BaseUrl.TrimEnd('/')}/api/motasticadapter/sync?since={since}&until={until}&skip=0&take={take}";
        using var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.Add("Authorization", settings.Authorization);

        using var response = await httpClient.SendAsync(request, ct);
        if (!response.IsSuccessStatusCode)
        {
            throw new HttpRequestException($"Failed to fetch chunk. Status: {response.StatusCode}");
        }

        await using var content = await response.Content.ReadAsStreamAsync(ct);
        var payload = await JsonSerializer.DeserializeAsync<LitiumSyncResponse>(content, JsonOptions, ct);
        return payload?.Orders?
            .Where(order => order is not null)
            .Select(order => Normalize(order!))
            .ToList() ?? [];
    }

    public static OrderSourceOrder Normalize(LitiumSyncResponse.LitiumOrderDto order)
    {
        if (!Enum.TryParse<OrderState>(order.OrderStatus, true, out var state))
        {
            state = OrderState.Unknown;
        }

        return new OrderSourceOrder(
            order.Id.ToString("D"),
            order.OrderNumber,
            order.CreatedDate.ToUniversalTime(),
            state,
            order.TotalValueIncludingVat,
            order.TotalValueExcludingVat,
            order.Currency ?? "UNK");
    }
}
