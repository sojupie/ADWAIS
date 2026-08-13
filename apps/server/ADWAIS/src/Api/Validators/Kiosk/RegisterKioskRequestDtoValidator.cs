// Part of the ADWAIS project, under the Business Source License 1.1.
// See /LICENSE for license information.
// SPDX-License-Identifier: BUSL-1.1

using Adwais.Api.DTOs.Kiosk;
using FluentValidation;

namespace Adwais.Api.Validators.Kiosk;

public class RegisterKioskRequestDtoValidator : AbstractValidator<RegisterKioskRequestDto>
{
    public RegisterKioskRequestDtoValidator()
    {
        RuleFor(x => x.DeviceId)
            .NotEmpty().WithMessage("Device identifier is required.")
            .MaximumLength(255).WithMessage("Device identifier must not exceed 255 characters.");
    }
}
