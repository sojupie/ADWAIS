using Adwais.Domain.Enums;

namespace Adwais.Application.DTOs.Financial.Upstream;

public sealed record OrderSourceOrder(
    string ExternalId,
    string OrderNumber,
    DateTimeOffset CreatedDate,
    OrderState State,
    decimal? TotalValueIncludingVat,
    decimal? TotalValueExcludingVat,
    string Currency);

public sealed record OrderSourceSettings(string BaseUrl, string Authorization);
