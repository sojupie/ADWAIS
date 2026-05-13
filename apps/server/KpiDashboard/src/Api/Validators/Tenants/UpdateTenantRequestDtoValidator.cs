using FluentValidation;
using Api.DTOs.Tenants;

namespace Api.Validators.Tenants;

public class UpdateTenantRequestDtoValidator :  AbstractValidator<UpdateTenantRequestDto>
{
    public UpdateTenantRequestDtoValidator()
    {
        RuleFor(x => x.Name).NotEmpty().WithMessage("Name cannot be empty.")
            .When(x => x.Name is not null);

        RuleFor(x => x.LitiumBaseUrl).NotEmpty().WithMessage("LitiumBaseUrl cannot be empty.")
            .When(x => x.LitiumBaseUrl is not null);
        RuleFor(x => x.LitiumBaseUrl).
            Must(uri => uri is not null && Uri.TryCreate(uri, UriKind.Absolute, out _))
            .WithMessage("INVALID URL.").When(x => x.LitiumBaseUrl is not null); 

        RuleFor(x => x.ServiceAccountToken).NotEmpty()
            .WithMessage("ServiceAccountToken cannot be empty.")
            .When(x => x.ServiceAccountToken is not null);
    }

}