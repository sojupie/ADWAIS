using FluentValidation.TestHelper;
using Adwais.Application.DTOs.Intranet;
using Adwais.Api.Validators.Intranet;
using Xunit;

namespace Adwais.Tests.Validators;

public class CommunityPostRequestValidatorTests
{
    private readonly CreatePostDtoValidator _validator = new();

    [Fact]
    public void Validator_ShouldHaveError_WhenTitleIsEmpty()
    {
        var model = new CreatePostDto { Title = "", Body = "Body" };
        var result = _validator.TestValidate(model);
        result.ShouldHaveValidationErrorFor(x => x.Title);
    }

    [Fact]
    public void Validator_ShouldHaveError_WhenTitleExceedsMaxLength()
    {
        var model = new CreatePostDto { Title = new string('a', 256), Body = "Body" };
        var result = _validator.TestValidate(model);
        result.ShouldHaveValidationErrorFor(x => x.Title);
    }

    [Fact]
    public void Validator_ShouldHaveError_WhenBodyIsEmpty()
    {
        var model = new CreatePostDto { Title = "Title", Body = "" };
        var result = _validator.TestValidate(model);
        result.ShouldHaveValidationErrorFor(x => x.Body);
    }

    [Fact]
    public void Validator_ShouldNotHaveError_WhenModelIsValid()
    {
        var model = new CreatePostDto { Title = "Valid Title", Body = "Valid Body" };
        var result = _validator.TestValidate(model);
        result.ShouldNotHaveAnyValidationErrors();
    }
}
