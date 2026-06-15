using FluentValidation;
using Adwais.Api.DTOs.Tenants;

namespace Adwais.Api.Validators.Tenants;

public class CreateTenantRequestDtoValidator : AbstractValidator<CreateTenantRequestDto>
{
    public CreateTenantRequestDtoValidator()
    {
        RuleFor(x => x.Name).NotEmpty().
            WithMessage("Name is required.");
        
        RuleFor(x => x.LitiumBaseUrl).NotEmpty().
            WithMessage("LitiumBaseUrl is required when order fetching is enabled.")
            .When(x => x.OrderFetchingEnabled);
        RuleFor(x => x.LitiumBaseUrl).Must(uri =>
            string.IsNullOrWhiteSpace(uri) || Uri.TryCreate(uri, UriKind.Absolute, out _)).WithMessage("INVALID URL");
    }

}

