using Adwais.Application.DTOs.GlobalConfig;
using FluentValidation;

namespace Adwais.Api.Validators.GlobalConfig;

public class UpdateGlobalConfigRequestDtoValidator : AbstractValidator<UpdateGlobalConfigRequestDto>
{
    public UpdateGlobalConfigRequestDtoValidator()
    {
        RuleFor(x => x.LatencyDegradedFloor)
            .GreaterThan(0)
            .When(x => x.LatencyDegradedFloor.HasValue)
            .WithMessage("Latency degraded floor must be greater than 0 ms.");

        RuleFor(x => x.SystemEventRetentionDays)
            .GreaterThan(0)
            .When(x => x.SystemEventRetentionDays.HasValue)
            .WithMessage("System event retention must be at least 1 day.");

        RuleFor(x => x.FeedFetchIntervalHours)
            .GreaterThan(0)
            .When(x => x.FeedFetchIntervalHours.HasValue)
            .WithMessage("Feed fetch interval must be at least 1 hour.");
    }
}


