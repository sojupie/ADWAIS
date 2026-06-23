using FluentValidation;
using Adwais.Application.DTOs.Intranet;

namespace Adwais.Api.Validators.Webhooks;

public class CreateNewsletterDtoValidator : AbstractValidator<CreateNewsletterDto>
{
    public CreateNewsletterDtoValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Title is required.")
            .MaximumLength(255).WithMessage("Title must not exceed 255 characters.");

        RuleFor(x => x.Body)
            .NotEmpty().WithMessage("Body is required.");

        RuleFor(x => x.Category)
            .NotEmpty().WithMessage("Category is required.")
            .MaximumLength(100).WithMessage("Category must not exceed 100 characters.");
    }
}
