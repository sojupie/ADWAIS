using Api.DTOs;
using Api.DTOs.Monitoring;

namespace Api.Validators;

using FluentValidation;

public class UptimeMonitorDtoValidator : AbstractValidator<UptimeMonitorDto>
{
    public UptimeMonitorDtoValidator()
    {
        RuleFor(x => x.Name).NotEmpty().WithMessage("NAME REQUIRED");
        RuleFor(x => x.Url).NotEmpty().WithMessage("URL EMPTY");
        RuleFor(x => x.Url).Must(uri => Uri.TryCreate(uri, UriKind.Absolute, out _)).WithMessage("INVALID URL");
    }
}