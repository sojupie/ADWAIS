using Adwais.Api.DTOs.Monitoring;
using FluentValidation;

namespace Adwais.Api.Validators.Monitoring;

public class UpdateMonitorRequestDtoValidator : AbstractValidator<UpdateMonitorRequestDto>
{
    public UpdateMonitorRequestDtoValidator()
    {
        RuleFor(x => x.Sla)
            .InclusiveBetween(0, 1).WithMessage("Uptime SLA must be between 0 and 1.");
    }
}


