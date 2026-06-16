using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Adwais.Application.Interfaces;
using Adwais.Domain.Entities;
using Adwais.Domain.Enums;
using Adwais.Infrastructure.Persistence;

namespace Adwais.Infrastructure.Services;

/// <summary>
/// Service managing system users database interactions.
/// </summary>
public class UserService(IDbContextFactory<AnalyticsDbContext> contextFactory) : IUserService
{
    private readonly IDbContextFactory<AnalyticsDbContext> _contextFactory = contextFactory;

    /// <inheritdoc />
    public async Task<IEnumerable<User>> GetUsersAsync(CancellationToken ct)
    {
        await using var db = await _contextFactory.CreateDbContextAsync(ct);
        return await db.Users
            .AsNoTracking()
            .ToListAsync(ct);
    }

    /// <inheritdoc />
    public async Task<User?> GetUserByIdAsync(Guid id, CancellationToken ct)
    {
        await using var db = await _contextFactory.CreateDbContextAsync(ct);
        return await db.Users
            .AsNoTracking()
            .SingleOrDefaultAsync(u => u.Id == id, ct);
    }

    /// <inheritdoc />
    public async Task<User> CreateUserAsync(string name, UserRole role, CancellationToken ct)
    {
        await using var db = await _contextFactory.CreateDbContextAsync(ct);
        var user = new User
        {
            Id = Guid.NewGuid(),
            Name = name,
            Role = role
        };

        db.Users.Add(user);
        await db.SaveChangesAsync(ct);
        return user;
    }

    /// <inheritdoc />
    public async Task<User?> UpdateUserAsync(Guid id, string? name, UserRole? role, CancellationToken ct)
    {
        await using var db = await _contextFactory.CreateDbContextAsync(ct);
        var user = await db.Users.SingleOrDefaultAsync(u => u.Id == id, ct);
        if (user == null)
        {
            return null;
        }

        if (name != null)
        {
            user.Name = name;
        }

        if (role.HasValue)
        {
            user.Role = role.Value;
        }

        await db.SaveChangesAsync(ct);
        return user;
    }

    /// <inheritdoc />
    public async Task<bool> DeleteUserAsync(Guid id, CancellationToken ct)
    {
        await using var db = await _contextFactory.CreateDbContextAsync(ct);
        var user = await db.Users.SingleOrDefaultAsync(u => u.Id == id, ct);
        if (user == null)
        {
            return false;
        }

        db.Users.Remove(user);
        await db.SaveChangesAsync(ct);
        return true;
    }
}
