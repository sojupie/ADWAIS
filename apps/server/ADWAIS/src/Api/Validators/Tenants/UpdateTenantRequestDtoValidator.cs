using FluentValidation;
using Adwais.Api.DTOs.Tenants;

namespace Adwais.Api.Validators.Tenants;

public class UpdateTenantRequestDtoValidator :  AbstractValidator<UpdateTenantRequestDto>
{
    public UpdateTenantRequestDtoValidator()
    {
        RuleFor(x => x.Name).NotEmpty().WithMessage("Name cannot be empty.")
            .When(x => x.Name is not null);

        RuleFor(x => x.LitiumBaseUrl)
            .Must(uri => string.IsNullOrWhiteSpace(uri) || Uri.TryCreate(uri, UriKind.Absolute, out _))
            .WithMessage("INVALID URL.");
        RuleFor(x => x.ImageUrl)
            .Must(uri => string.IsNullOrWhiteSpace(uri) || Uri.TryCreate(uri, UriKind.Absolute, out _))
            .WithMessage("INVALID IMAGE URL.");
    }

}

