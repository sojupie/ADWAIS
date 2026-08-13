// Part of the ADWAIS project, under the Business Source License 1.1.
// See /LICENSE for license information.
// SPDX-License-Identifier: BUSL-1.1

using Adwais.Domain.Enums;
using Microsoft.AspNetCore.Mvc;

namespace Adwais.Api.DTOs.Financial;

public record TransactionDensityRequestDto
{
    /// <summary>
    /// Requested analysis window. Auto selects the shortest supported period
    /// with enough observations for a stable 168-bucket matrix.
    /// </summary>
    [FromQuery(Name = "period")]
    public TransactionDensityPeriod Period { get; init; } = TransactionDensityPeriod.Auto;

    /// <summary>
    /// Optional tenant scope. If omitted, the matrix represents the portfolio.
    /// </summary>
    [FromQuery(Name = "tenantId")]
    public Guid? TenantId { get; init; }

    /// <summary>
    /// Optional. Restricts the portfolio matrix to tenants with one of these business models.
    /// Ignored when tenantId is provided.
    /// </summary>
    [FromQuery(Name = "tenantTypes")]
    public IReadOnlyList<TenantType>? TenantTypes { get; init; }
}
