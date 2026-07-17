using Adwais.Api.DTOs.Financial;
using FluentValidation;

namespace Adwais.Api.Validators.Financial;

public class TransactionDensityRequestDtoValidator : AbstractValidator<TransactionDensityRequestDto>
{
    public TransactionDensityRequestDtoValidator()
    {
        RuleFor(x => x.Period)
            .IsInEnum().WithMessage("A valid transaction density period is required.");
    }
}
