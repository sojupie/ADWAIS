// Part of the ADWAIS project, under the Business Source License 1.1.
// See /LICENSE for license information.
// SPDX-License-Identifier: BUSL-1.1

using Adwais.Api.DTOs.Financial;
using FluentValidation;

namespace Adwais.Api.Validators.Financial;

public class OrderRequestDtoValidator : AbstractValidator<OrderRequestDto>
{
    public OrderRequestDtoValidator()
    {
        RuleFor(x => x.CeilingCount).GreaterThan(0).LessThanOrEqualTo(100);
        RuleFor(x => x.DateSince).LessThan(x => x.DateUntil).GreaterThanOrEqualTo(DateTimeOffset.MinValue).LessThanOrEqualTo(DateTimeOffset.MaxValue);
        RuleFor(x => x.DateUntil).LessThan(x => DateTimeOffset.UtcNow).GreaterThanOrEqualTo(DateTimeOffset.MinValue).LessThanOrEqualTo(DateTimeOffset.MaxValue);
    }
}