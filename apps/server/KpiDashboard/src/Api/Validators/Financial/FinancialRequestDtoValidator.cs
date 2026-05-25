using Api.DTOs.Financial;
using FluentValidation;

namespace Api.Validators.Financial;

public class FinancialRequestDtoValidator : AbstractValidator<FinancialRequestDto>
{
    public FinancialRequestDtoValidator()
    {
        RuleFor(x => x.Timeframe)
            .IsInEnum().WithMessage("A valid timeframe is required.");
    }
}
