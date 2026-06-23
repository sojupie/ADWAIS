using FluentValidation.TestHelper;
using Adwais.Application.DTOs.Intranet;
using Adwais.Api.Validators.Webhooks;
using Xunit;

namespace Adwais.Tests.Validators;

public class NewsletterRequestValidatorTests
{
    private readonly CreateNewsletterDtoValidator _validator = new();

    [Fact]
    public void Validator_ShouldHaveError_WhenTitleIsEmpty()
    {
        var model = new CreateNewsletterDto { Title = "", Body = "Body", Category = "General" };
        var result = _validator.TestValidate(model);
        result.ShouldHaveValidationErrorFor(x => x.Title);
    }

    [Fact]
    public void Validator_ShouldHaveError_WhenTitleExceedsMaxLength()
    {
        var model = new CreateNewsletterDto { Title = new string('a', 256), Body = "Body", Category = "General" };
        var result = _validator.TestValidate(model);
        result.ShouldHaveValidationErrorFor(x => x.Title);
    }

    [Fact]
    public void Validator_ShouldHaveError_WhenBodyIsEmpty()
    {
        var model = new CreateNewsletterDto { Title = "Title", Body = "", Category = "General" };
        var result = _validator.TestValidate(model);
        result.ShouldHaveValidationErrorFor(x => x.Body);
    }

    [Fact]
    public void Validator_ShouldHaveError_WhenCategoryIsEmpty()
    {
        var model = new CreateNewsletterDto { Title = "Title", Body = "Body", Category = "" };
        var result = _validator.TestValidate(model);
        result.ShouldHaveValidationErrorFor(x => x.Category);
    }

    [Fact]
    public void Validator_ShouldHaveError_WhenCategoryExceedsMaxLength()
    {
        var model = new CreateNewsletterDto { Title = "Title", Body = "Body", Category = new string('a', 101) };
        var result = _validator.TestValidate(model);
        result.ShouldHaveValidationErrorFor(x => x.Category);
    }

    [Fact]
    public void Validator_ShouldNotHaveError_WhenModelIsValid()
    {
        var model = new CreateNewsletterDto { Title = "Valid Title", Body = "Valid Body", Category = "General" };
        var result = _validator.TestValidate(model);
        result.ShouldNotHaveAnyValidationErrors();
    }
}
