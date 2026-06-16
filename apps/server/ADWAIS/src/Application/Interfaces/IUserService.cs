using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Adwais.Domain.Entities;
using Adwais.Domain.Enums;

namespace Adwais.Application.Interfaces;

public interface IUserService
{
    Task<IEnumerable<User>> GetUsersAsync(CancellationToken ct);
    Task<User?> GetUserByIdAsync(Guid id, CancellationToken ct);
    Task<User> CreateUserAsync(string name, UserRole role, CancellationToken ct);
    Task<User?> UpdateUserAsync(Guid id, string? name, UserRole? role, CancellationToken ct);
    Task<bool> DeleteUserAsync(Guid id, CancellationToken ct);
}
