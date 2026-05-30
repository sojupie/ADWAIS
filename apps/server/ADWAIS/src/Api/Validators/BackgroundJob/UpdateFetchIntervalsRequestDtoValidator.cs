using Adwais.Api.DTOs.BackgroundJob;
using FluentValidation;

namespace Adwais.Api.Validators.BackgroundJob;

public class UpdateFetchIntervalsRequestDtoValidator : AbstractValidator<UpdateFetchIntervalsRequestDto>
{
    public UpdateFetchIntervalsRequestDtoValidator()
    {
        RuleFor(x => x.LitiumFetchIntervalMinutes)
            .GreaterThan(0)
            .When(x => x.LitiumFetchIntervalMinutes.HasValue)
            .WithMessage("Litium fetch interval must be at least 1 minute.");

        RuleFor(x => x.UptimeFetchIntervalMinutes)
            .GreaterThan(0)
            .When(x => x.UptimeFetchIntervalMinutes.HasValue)
            .WithMessage("Uptime fetch interval must be at least 1 minute.");

        RuleFor(x => x.UserStatsFetchIntervalMinutes)
            .GreaterThan(0)
            .When(x => x.UserStatsFetchIntervalMinutes.HasValue)
            .WithMessage("User stats fetch interval must be at least 1 minute.");

        RuleFor(x => x.LatencyFetchIntervalMinutes)
            .GreaterThan(0)
            .When(x => x.LatencyFetchIntervalMinutes.HasValue)
            .WithMessage("Latency fetch interval must be at least 1 minute.");
    }
}


