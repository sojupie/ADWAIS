using Api.DTOs.Financial;
using FluentValidation;

namespace Api.Validators.Financial;

public class DistributionRequestDtoValidator : AbstractValidator<DistributionRequestDto>
{
    public DistributionRequestDtoValidator()
    {
        RuleFor(x => x.TopN)
            .GreaterThan(0)
            .WithMessage("TopN must be greater than 0.");
    }
}
