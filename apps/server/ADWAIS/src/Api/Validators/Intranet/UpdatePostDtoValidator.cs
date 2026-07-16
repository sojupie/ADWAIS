using Adwais.Application.DTOs.Intranet;
using FluentValidation;

namespace Adwais.Api.Validators.Intranet;

public class UpdatePostDtoValidator : AbstractValidator<UpdatePostDto>
{
    public UpdatePostDtoValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Title must not be empty.")
            .MaximumLength(255).WithMessage("Title must not exceed 255 characters.")
            .When(x => x.Title != null);

        RuleFor(x => x.Body)
            .NotEmpty().WithMessage("Body must not be empty.")
            .MaximumLength(5000).WithMessage("Body must not exceed 5000 characters.")
            .When(x => x.Body != null);
    }
}
