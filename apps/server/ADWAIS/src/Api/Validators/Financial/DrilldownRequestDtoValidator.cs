// Part of the ADWAIS project, under the Business Source License 1.1.
// See /LICENSE for license information.
// SPDX-License-Identifier: BUSL-1.1

using Adwais.Api.DTOs.Financial;
using FluentValidation;

namespace Adwais.Api.Validators.Financial;

public class DrilldownRequestDtoValidator : AbstractValidator<DrilldownRequestDto>
{
    public DrilldownRequestDtoValidator()
    {
        RuleFor(x => x.TenantId)
            .NotEmpty()
            .WithMessage("TenantId is required.");
    }
}


