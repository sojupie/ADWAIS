using Api.DTOs.Users;
using FluentValidation;

namespace Api.Validators.Users;

public class CreateUserRequestDtoValidator : AbstractValidator<CreateUserRequestDto>
{
    public CreateUserRequestDtoValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("User name is required.")
            .MaximumLength(100).WithMessage("User name must not exceed 100 characters.");

        RuleFor(x => x.Role)
            .IsInEnum().WithMessage("A valid user role is required.");
    }
}
