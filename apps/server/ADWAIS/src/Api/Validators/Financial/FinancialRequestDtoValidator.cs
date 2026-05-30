using Adwais.Api.DTOs.Financial;
using FluentValidation;

namespace Adwais.Api.Validators.Financial;

public class FinancialRequestDtoValidator : AbstractValidator<FinancialRequestDto>
{
    public FinancialRequestDtoValidator()
    {
        RuleFor(x => x.Timeframe)
            .IsInEnum().WithMessage("A valid timeframe is required.");
    }
}


