// Part of the ADWAIS project, under the Business Source License 1.1.
// See /LICENSE for license information.
// SPDX-License-Identifier: BUSL-1.1

using FluentValidation;
using Adwais.Application.DTOs.Intranet;

namespace Adwais.Api.Validators.Intranet;

public class GetFeedsRequestValidator : AbstractValidator<GetFeedsRequest>
{
    public GetFeedsRequestValidator()
    {
        RuleFor(x => x.Page)
            .GreaterThanOrEqualTo(1).WithMessage("Page number must be greater than or equal to 1.");

        RuleFor(x => x.PageSize)
            .InclusiveBetween(1, 100).WithMessage("Page size must be between 1 and 100.");

        RuleFor(x => x.AuthorName)
            .MaximumLength(255).WithMessage("Author name must not exceed 255 characters.");
    }
}
