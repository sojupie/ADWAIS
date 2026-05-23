using Api.DTOs.Financial;
using FluentValidation;

namespace Api.Validators.Financial;

public class DrilldownRequestDtoValidator : AbstractValidator<DrilldownRequestDto>
{
    public DrilldownRequestDtoValidator()
    {
        RuleFor(x => x.TenantId)
            .NotEmpty()
            .WithMessage("TenantId is required.");
    }
}
