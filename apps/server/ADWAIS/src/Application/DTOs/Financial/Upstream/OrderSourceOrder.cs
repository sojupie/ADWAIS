// Part of the ADWAIS project, under the Business Source License 1.1.
// See /LICENSE for license information.
// SPDX-License-Identifier: BUSL-1.1

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
