using FluentValidation;
using Adwais.Application.DTOs.Intranet;

namespace Adwais.Api.Validators.Intranet;

public class CreateOfficeEventDtoValidator : AbstractValidator<CreateOfficeEventDto>
{
    public CreateOfficeEventDtoValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Title is required.")
            .MaximumLength(255).WithMessage("Title must not exceed 255 characters.");

        RuleFor(x => x.EventType)
            .IsInEnum().WithMessage("A valid EventType is required.");

        RuleFor(x => x.Recurrence)
            .IsInEnum().WithMessage("A valid Recurrence is required.");

        RuleFor(x => x.EndTime)
            .GreaterThanOrEqualTo(x => x.StartTime).WithMessage("End time must be greater than or equal to start time.");
    }
}
