using Adwais.Api.DTOs.Financial;
using FluentValidation;

namespace Adwais.Api.Validators.Financial;

public class DrilldownRequestDtoValidator : AbstractValidator<DrilldownRequestDto>
{
    public DrilldownRequestDtoValidator()
    {
        RuleFor(x => x.TenantId)
            .NotEmpty()
            .WithMessage("TenantId is required.");
    }
}


