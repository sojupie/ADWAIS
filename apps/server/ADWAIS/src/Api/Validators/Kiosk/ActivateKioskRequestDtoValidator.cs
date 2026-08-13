// Part of the ADWAIS project, under the Business Source License 1.1.
// See /LICENSE for license information.
// SPDX-License-Identifier: BUSL-1.1

using Adwais.Api.DTOs.Kiosk;
using FluentValidation;

namespace Adwais.Api.Validators.Kiosk;

public class ActivateKioskRequestDtoValidator : AbstractValidator<ActivateKioskRequestDto>
{
    public ActivateKioskRequestDtoValidator()
    {
        RuleFor(x => x.ActivationCode)
            .NotEmpty().WithMessage("Activation code is required.")
            .Length(6).WithMessage("Activation code must be exactly 6 characters.");
    }
}
