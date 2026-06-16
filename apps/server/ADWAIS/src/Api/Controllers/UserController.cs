using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Adwais.Api.DTOs.Users;
using Adwais.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Adwais.Api.Controllers;

/// <summary>
/// Manages system users and their database-assigned roles.
/// </summary>
[ApiController]
[Route("api/users")]
[Authorize(Policy = "AdminOnly")]
public class UserController(IUserService userService) : ControllerBase
{
    private readonly IUserService _userService = userService;

    [HttpGet]
    public async Task<ActionResult<IEnumerable<UserResponseDto>>> GetUsers(CancellationToken ct)
    {
        var users = await _userService.GetUsersAsync(ct);
        var response = users.Select(u => new UserResponseDto(u.Id, u.Name, u.Role));
        return Ok(response);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<UserResponseDto>> GetUser(Guid id, CancellationToken ct)
    {
        var user = await _userService.GetUserByIdAsync(id, ct);
        if (user == null)
        {
            return NotFound();
        }
        return Ok(new UserResponseDto(user.Id, user.Name, user.Role));
    }

    /// <summary>
    /// Manually creates a new user record.
    /// Used for pre-provisioning users before EntraID sign-in.
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<UserResponseDto>> CreateUser([FromBody] CreateUserRequestDto request, CancellationToken ct)
    {
        var user = await _userService.CreateUserAsync(request.Name, request.Role, ct);
        return CreatedAtAction(nameof(GetUser), new { id = user.Id }, new UserResponseDto(user.Id, user.Name, user.Role));
    }

    [HttpPatch("{id:guid}")]
    public async Task<ActionResult<UserResponseDto>> UpdateUser(Guid id, [FromBody] UpdateUserRequestDto request, CancellationToken ct)
    {
        var user = await _userService.UpdateUserAsync(id, request.Name, request.Role, ct);
        if (user == null)
        {
            return NotFound();
        }
        return Ok(new UserResponseDto(user.Id, user.Name, user.Role));
    }

    [HttpDelete("{id:guid}")]
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
