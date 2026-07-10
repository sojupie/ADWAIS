using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Adwais.Api.DTOs.Users;
using Adwais.Application.Interfaces;
using Adwais.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Adwais.Api.Controllers;

/// <summary>
/// Manages system users and their database-assigned roles.
/// </summary>
[ApiController]
[Route("api/users")]
public class UserController(IUserService userService) : ControllerBase
{
    private readonly IUserService _userService = userService;

    [HttpGet("me")]
    [Authorize(Policy = "KioskOrStaffAccess")]
    public async Task<ActionResult<UserResponseDto>> GetMe(CancellationToken ct)
    {
        var oidClaim = User.FindFirst("http://schemas.microsoft.com/identity/claims/objectidentifier")?.Value ?? User.FindFirst("oid")?.Value;

        if (!string.IsNullOrEmpty(oidClaim) && Guid.TryParse(oidClaim, out var entraOid))
        {
            var user = await _userService.GetUserByEntraObjectIdAsync(entraOid, ct);
            if (user != null)
            {
                return Ok(new UserResponseDto(user.Id, user.Name, user.Email, user.Role));
            }
        }
        
        var role = User.FindFirst("role")?.Value ?? User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;
        var kioskRole = role switch
        {
            "Admin"    => (UserRole?)UserRole.Admin,
            "Employee" => UserRole.Employee,
            "Viewer"   => UserRole.Viewer,
            _          => null
        };

        if (!kioskRole.HasValue) return Unauthorized("User context is invalid or not registered.");
        
        var name = User.Identity?.Name ?? User.FindFirst("name")?.Value ?? "Kiosk Device";
        return Ok(new UserResponseDto(Guid.Empty, name, null, kioskRole.Value));

    }

    [HttpGet]
    [Authorize(Policy = "KioskOrStaffAccess")]
    public async Task<ActionResult<IEnumerable<UserResponseDto>>> GetUsers(CancellationToken ct)
    {
        var users = await _userService.GetUsersAsync(ct);
        var response = users.Select(u => new UserResponseDto(u.Id, u.Name, u.Email, u.Role));
        return Ok(response);
    }

    [HttpGet("{id:guid}")]
    [Authorize(Policy = "KioskOrStaffAccess")]
    public async Task<ActionResult<UserResponseDto>> GetUser(Guid id, CancellationToken ct)
    {
        var user = await _userService.GetUserByIdAsync(id, ct);
        if (user == null)
        {
            return NotFound();
        }

        return Ok(new UserResponseDto(user.Id, user.Name, user.Email, user.Role));
    }

    /// <summary>
    /// Manually creates a new user record.
    /// Used for pre-provisioning users before EntraID sign-in.
    /// </summary>
    [HttpPost]
    [Authorize(Policy = "AdminOnly")]
    public async Task<ActionResult<UserResponseDto>> CreateUser([FromBody] CreateUserRequestDto request, CancellationToken ct)
    {
        var user = await _userService.CreateUserAsync(request.Email, request.Role, ct);
        return CreatedAtAction(nameof(GetUser), new { id = user.Id },
            new UserResponseDto(user.Id, user.Name, user.Email, user.Role));
    }

    [HttpPatch("{id:guid}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<ActionResult<UserResponseDto>> UpdateUser(Guid id, [FromBody] UpdateUserRequestDto request, CancellationToken ct)
    {
        var user = await _userService.UpdateUserAsync(id, request.Name, request.Role, ct);
        if (user == null)
        {
            return NotFound();
        }

        return Ok(new UserResponseDto(user.Id, user.Name, user.Email, user.Role));
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> DeleteUser(Guid id, CancellationToken ct)
    {
        var success = await _userService.DeleteUserAsync(id, ct);
        if (!success)
        {
            return NotFound();
        }

        return NoContent();
    }
}
