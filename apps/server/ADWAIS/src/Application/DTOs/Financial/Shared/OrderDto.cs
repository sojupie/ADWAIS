using Adwais.Domain.Enums;

namespace Adwais.Application.DTOs.Financial;

public record OrderDto(
    Guid AdwaisOrderId,
    string LitiumOrderId,
    Guid AdwaisTenantId,
    OrderState OrderState,
    DateTimeOffset CreatedDate,
    decimal TotalValueIncVat,
    decimal TotalValueExcVat,
    string? Currency,
    string? TenantName);