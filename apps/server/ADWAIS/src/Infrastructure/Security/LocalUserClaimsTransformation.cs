using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Adwais.Domain.Entities;
using Adwais.Domain.Enums;
using Microsoft.AspNetCore.Authentication;
using Microsoft.EntityFrameworkCore;
using Adwais.Infrastructure.Persistence;
using Microsoft.Identity.Web;

namespace Adwais.Infrastructure.Security;

/// <summary>
/// Intercepts incoming ClaimsPrincipals to auto-provision new users and map external Entra ID users to system database roles.
/// </summary>
public class LocalUserClaimsTransformation(IDbContextFactory<AnalyticsDbContext> dbContextFactory) : IClaimsTransformation
{
    private readonly IDbContextFactory<AnalyticsDbContext> _dbContextFactory = dbContextFactory;

    /// <inheritdoc />
    public async Task<ClaimsPrincipal> TransformAsync(ClaimsPrincipal principal)
    {
        if (principal.Identity == null || !principal.Identity.IsAuthenticated)
        {
            return principal;
        }

        // Extract Entra ID unique Object Identifier (oid claim)
        var oidClaim = principal.FindFirst("http://schemas.microsoft.com/identity/claims/objectidentifier")?.Value 
                       ?? principal.FindFirst("oid")?.Value;

        if (string.IsNullOrEmpty(oidClaim) || !Guid.TryParse(oidClaim, out var entraOid))
        {
            return principal;
        }

        await using var db = await _dbContextFactory.CreateDbContextAsync();
        var user = await db.Users.SingleOrDefaultAsync(u => u.EntraObjectId == entraOid);

        var name = principal.FindFirst("name")?.Value 
                   ?? principal.FindFirst(ClaimTypes.Name)?.Value 
                   ?? "New User";
        var email = principal.FindFirst("preferred_username")?.Value 
                    ?? principal.FindFirst("email")?.Value
                    ?? principal.FindFirst("upn")?.Value
                    ?? principal.FindFirst("unique_name")?.Value
                    ?? principal.FindFirst(ClaimTypes.Email)?.Value
                    ?? principal.FindFirst(ClaimTypes.Upn)?.Value;

        if (user != null)
        {
            bool modified = false;
            if (user.Name != name)
            {
                user.Name = name;
                modified = true;
            }
            if (user.Email != email && !string.IsNullOrEmpty(email))
            {
                user.Email = email;
                modified = true;
            }
            if (modified)
            {
                await db.SaveChangesAsync();
            }
        }
        else
        {
            if (!string.IsNullOrEmpty(email))
            {
                var lowerEmail = email.ToLowerInvariant();
                user = await db.Users.FirstOrDefaultAsync(u => u.EntraObjectId == null && u.Email != null && u.Email.ToLower() == lowerEmail);

                if (user != null)
                {
                    user.EntraObjectId = entraOid;
                    user.Name = name;
                    await db.SaveChangesAsync();
                }
            }

            if (user == null)
            {
                // Auto-provision user with default Employee role
                user = new User
                {
                    Id = Guid.NewGuid(),
                    EntraObjectId = entraOid,
                    Name = name,
                    Email = email,
                    Role = UserRole.Employee
                };

                db.Users.Add(user);
                await db.SaveChangesAsync();
            }
        }

        // Append role claim using a cloned principal to ensure thread-safety/immutability
        var clone = principal.Clone();
        
        if (clone.Identity is ClaimsIdentity primaryIdentity)
        {
            var existingNameIds = primaryIdentity.FindAll(ClaimTypes.NameIdentifier).ToList();
            foreach (var claim in existingNameIds)
            {
                primaryIdentity.RemoveClaim(claim);
            }
        }

        var localIdentity = new ClaimsIdentity();
        localIdentity.AddClaim(new Claim(ClaimTypes.Role, user.Role.ToString()));
        localIdentity.AddClaim(new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()));
        clone.AddIdentity(localIdentity);

        return clone;
    }
}
