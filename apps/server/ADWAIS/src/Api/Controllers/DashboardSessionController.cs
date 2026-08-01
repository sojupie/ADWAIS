using System.Security.Claims;
using Adwais.Api.Extensions;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Adwais.Api.Controllers;

[ApiController]
[Route("api/dashboard-session")]
public class DashboardSessionController : ControllerBase
{
    [HttpPost]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> Create()
    {
        var identity = new ClaimsIdentity(
            [
                new Claim(ClaimTypes.Name, User.Identity?.Name ?? "Admin"),
                new Claim(ClaimTypes.Role, "Admin")
            ],
            AuthenticationExtensions.DashboardCookieScheme);

        await HttpContext.SignInAsync(
            AuthenticationExtensions.DashboardCookieScheme,
            new ClaimsPrincipal(identity),
            new AuthenticationProperties
            {
                AllowRefresh = false,
                ExpiresUtc = DateTimeOffset.UtcNow.AddMinutes(5),
                IsPersistent = false
            });

        return NoContent();
    }

    [HttpDelete]
    [AllowAnonymous]
    public async Task<IActionResult> Delete()
    {
        await HttpContext.SignOutAsync(AuthenticationExtensions.DashboardCookieScheme);
        return NoContent();
    }
}
