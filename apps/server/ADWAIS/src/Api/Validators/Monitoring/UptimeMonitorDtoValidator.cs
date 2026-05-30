using Adwais.Api.DTOs.Monitoring;
using FluentValidation;

namespace Adwais.Api.Validators.Monitoring;

public class UptimeMonitorDtoValidator : AbstractValidator<UptimeMonitorDto>
{
    public UptimeMonitorDtoValidator()
    {
        RuleFor(x => x.Name).NotEmpty().WithMessage("NAME REQUIRED");
        RuleFor(x => x.Url).NotEmpty().WithMessage("URL EMPTY");
        RuleFor(x => x.Url).Must(uri => Uri.TryCreate(uri, UriKind.Absolute, out _)).WithMessage("INVALID URL");
    }
}

