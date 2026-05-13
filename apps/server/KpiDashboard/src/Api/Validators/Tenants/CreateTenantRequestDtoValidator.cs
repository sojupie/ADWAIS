using FluentValidation;
using Api.DTOs.Tenants;

namespace Api.Validators.Tenants;

public class CreateTenantRequestDtoValidator : AbstractValidator<CreateTenantRequestDto>
{
    public CreateTenantRequestDtoValidator()
    {
        RuleFor(x => x.Name).NotEmpty().
            WithMessage("Name is required.");
        
        RuleFor(x => x.LitiumBaseUrl).NotEmpty().
            WithMessage("LitiumBaseUrl is required.");
        RuleFor(x => x.LitiumBaseUrl).Must(uri =>
            Uri.TryCreate(uri, UriKind.Absolute, out _)).WithMessage("INVALID URL");
        
        RuleFor(x => x.ServiceAccountToken).NotEmpty()
            .WithMessage("ServiceAccountToken is required.");
    }

}