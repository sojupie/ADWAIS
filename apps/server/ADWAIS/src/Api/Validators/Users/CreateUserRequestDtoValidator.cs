// Part of the ADWAIS project, under the Business Source License 1.1.
// See /LICENSE for license information.
// SPDX-License-Identifier: BUSL-1.1

using Adwais.Api.DTOs.Users;
using FluentValidation;

namespace Adwais.Api.Validators.Users;

public class CreateUserRequestDtoValidator : AbstractValidator<CreateUserRequestDto>
{
    public CreateUserRequestDtoValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("User email is required.")
            .EmailAddress().WithMessage("A valid email address is required.")
            .MaximumLength(255).WithMessage("User email must not exceed 255 characters.");

        RuleFor(x => x.Role)
            .IsInEnum().WithMessage("A valid user role is required.");
    }
}


