using Api.DTOs.Users;
using FluentValidation;

namespace Api.Validators.Users;

public class UpdateUserRequestDtoValidator : AbstractValidator<UpdateUserRequestDto>
{
    public UpdateUserRequestDtoValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().When(x => x.Name != null)
            .WithMessage("User name cannot be empty.")
            .MaximumLength(100).When(x => x.Name != null)
            .WithMessage("User name must not exceed 100 characters.");

        RuleFor(x => x.Role)
            .IsInEnum().When(x => x.Role.HasValue)
            .WithMessage("A valid user role is required.");
    }
}
