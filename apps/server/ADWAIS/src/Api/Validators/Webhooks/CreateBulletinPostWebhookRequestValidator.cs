// Part of the ADWAIS project, under the Business Source License 1.1.
// See /LICENSE for license information.
// SPDX-License-Identifier: BUSL-1.1

using FluentValidation;
using Adwais.Application.DTOs.Intranet;

namespace Adwais.Api.Validators.Webhooks;

public class CreateBulletinPostWebhookRequestValidator : AbstractValidator<CreateBulletinPostWebhookRequest>
{
    public CreateBulletinPostWebhookRequestValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Title is required.")
            .MaximumLength(255).WithMessage("Title must not exceed 255 characters.");

        RuleFor(x => x.Body)
            .NotEmpty().WithMessage("Body is required.");
    }
}
