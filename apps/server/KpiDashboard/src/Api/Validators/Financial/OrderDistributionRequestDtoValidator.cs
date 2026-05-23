using Api.DTOs.Financial;
using FluentValidation;

namespace Api.Validators.Financial;

public class OrderDistributionRequestDtoValidator : AbstractValidator<OrderDistributionRequestDto>
{
    public OrderDistributionRequestDtoValidator()
    {
        RuleFor(x => x.TenantId)
            .NotEmpty()
            .WithMessage("TenantId is required.");

        RuleFor(x => x.BinCount)
            .GreaterThan(0)
            .When(x => x.BinCount.HasValue)
            .WithMessage("BinCount must be greater than 0.");
    }
}
