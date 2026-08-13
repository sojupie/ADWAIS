// Part of the ADWAIS project, under the Business Source License 1.1.
// See /LICENSE for license information.
// SPDX-License-Identifier: BUSL-1.1

using FluentValidation;
using Adwais.Api.DTOs.Tenants;
using Adwais.Application.Interfaces;

namespace Adwais.Api.Validators.Tenants;

public class UpdateTenantRequestDtoValidator :  AbstractValidator<UpdateTenantRequestDto>
{
    public UpdateTenantRequestDtoValidator(IEnumerable<IOrderSource> orderSources)
    {
        RuleFor(x => x.Name).NotEmpty().WithMessage("Name cannot be empty.")
            .When(x => x.Name is not null);
        RuleFor(x => x.OrderProvider)
            .NotEmpty()
            .MaximumLength(100)
            .Matches("^[a-z0-9-]+$")
            .Must(provider => orderSources.Any(source => source.Provider.Equals(provider, StringComparison.OrdinalIgnoreCase)))
            .WithMessage("Order provider is not registered.")
            .When(x => x.OrderProvider is not null);

        RuleFor(x => x.ImageUrl)
            .Must(uri => string.IsNullOrWhiteSpace(uri) || Uri.TryCreate(uri, UriKind.Absolute, out _))
            .WithMessage("INVALID IMAGE URL.");
    }

}

