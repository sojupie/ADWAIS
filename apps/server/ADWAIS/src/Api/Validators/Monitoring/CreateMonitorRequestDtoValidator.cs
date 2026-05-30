using Adwais.Api.DTOs.Monitoring;
using FluentValidation;

namespace Adwais.Api.Validators.Monitoring;

public class CreateMonitorRequestDtoValidator : AbstractValidator<CreateMonitorRequestDto>
{
    public CreateMonitorRequestDtoValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Monitor name is required.")
            .MaximumLength(100).WithMessage("Monitor name must not exceed 100 characters.");

        RuleFor(x => x.Url)
            .NotEmpty().WithMessage("URL is required.")
            .Must(uri => Uri.TryCreate(uri, UriKind.Absolute, out _))
            .WithMessage("A valid absolute URL is required.");

        RuleFor(x => x.UptimeSla)
            .InclusiveBetween(0, 100).When(x => x.UptimeSla.HasValue)
            .WithMessage("Uptime SLA must be between 0 and 100.");
    }
}


