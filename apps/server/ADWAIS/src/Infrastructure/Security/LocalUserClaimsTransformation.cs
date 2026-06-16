using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Adwais.Domain.Entities;
using Adwais.Domain.Enums;
using Microsoft.AspNetCore.Authentication;
using Microsoft.EntityFrameworkCore;
using Adwais.Infrastructure.Persistence;
using Microsoft.Identity.Web;

namespace Adwais.Infrastructure.Security;

public class LocalUserClaimsTransformation(IDbContextFactory<AnalyticsDbContext> dbContextFactory) : IClaimsTransformation
{
    private readonly IDbContextFactory<AnalyticsDbContext> _dbContextFactory = dbContextFactory;

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

        if (user == null)
        {
            // Auto-provision user with default Employee role
            var name = principal.FindFirst("name")?.Value 
                       ?? principal.FindFirst(ClaimTypes.Name)?.Value 
                       ?? "New User";
            var email = principal.FindFirst("preferred_username")?.Value 
                        ?? principal.FindFirst(ClaimTypes.Email)?.Value;

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

        // Append role claim using a cloned principal to ensure thread-safety/immutability
        var clone = principal.Clone();
        var localIdentity = new ClaimsIdentity();
        localIdentity.AddClaim(new Claim(ClaimTypes.Role, user.Role.ToString()));
        clone.AddIdentity(localIdentity);

        return clone;
    }
}
