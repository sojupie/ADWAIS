using Adwais.Api.DTOs.Users;
using Adwais.Domain.Entities;
using Adwais.Infrastructure;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Adwais.Api.Controllers;

/// <summary>
/// Manages system users and their database-assigned roles.
/// Preparing for EntraID integration where auth is external but authorization is local.
/// </summary>
[ApiController]
[Route("api/users")]
public class UserController(IDbContextFactory<AnalyticsDbContext> dbContextFactory) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<UserResponseDto>>> GetUsers()
    {
        await using var db = await dbContextFactory.CreateDbContextAsync();
        var users = await db.Users
            .AsNoTracking()
            .Select(u => new UserResponseDto(u.Id, u.Name, u.Role))
            .ToListAsync();
        return Ok(users);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<UserResponseDto>> GetUser(Guid id)
    {
        await using var db = await dbContextFactory.CreateDbContextAsync();
        var user = await db.Users
            .AsNoTracking()
            .Where(u => u.Id == id)
            .Select(u => new UserResponseDto(u.Id, u.Name, u.Role))
            .SingleOrDefaultAsync();

        if (user == null) return NotFound();
        return Ok(user);
    }

    /// <summary>
    /// Manually creates a new user record.
    /// Used for pre-provisioning users before EntraID sign-in.
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<UserResponseDto>> CreateUser([FromBody] CreateUserRequestDto request)
    {
        await using var db = await dbContextFactory.CreateDbContextAsync();
        var user = new User
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            Role = request.Role
        };

        db.Users.Add(user);
        await db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetUser), new { id = user.Id }, new UserResponseDto(user.Id, user.Name, user.Role));
    }

    [HttpPatch("{id:guid}")]
    public async Task<ActionResult<UserResponseDto>> UpdateUser(Guid id, [FromBody] UpdateUserRequestDto request)
    {
        await using var db = await dbContextFactory.CreateDbContextAsync();
        var user = await db.Users.SingleOrDefaultAsync(u => u.Id == id);
        if (user == null) return NotFound();

        if (request.Name != null) user.Name = request.Name;
        if (request.Role.HasValue) user.Role = request.Role.Value;

        await db.SaveChangesAsync();
        return Ok(new UserResponseDto(user.Id, user.Name, user.Role));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteUser(Guid id)
    {
        await using var db = await dbContextFactory.CreateDbContextAsync();
        var user = await db.Users.SingleOrDefaultAsync(u => u.Id == id);
        if (user == null) return NotFound();

        db.Users.Remove(user);
        await db.SaveChangesAsync();
        return NoContent();
    }
}


