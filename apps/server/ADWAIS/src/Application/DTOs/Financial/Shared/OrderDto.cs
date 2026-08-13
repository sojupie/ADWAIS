// Part of the ADWAIS project, under the Business Source License 1.1.
// See /LICENSE for license information.
// SPDX-License-Identifier: BUSL-1.1

using Adwais.Domain.Enums;

namespace Adwais.Application.DTOs.Financial;

public record OrderDto(
    Guid AdwaisOrderId,
    string OrderNumber,
    Guid AdwaisTenantId,
    OrderState OrderState,
    DateTimeOffset CreatedDate,
    decimal TotalValueIncVat,
    decimal TotalValueExcVat,
    string? Currency,
    string? TenantName,
    string Provider,
    string ExternalId);
