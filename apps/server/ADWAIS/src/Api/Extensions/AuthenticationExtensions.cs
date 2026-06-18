using System;
using System.Text;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Identity.Web;
using Microsoft.IdentityModel.Tokens;
using Adwais.Infrastructure.Security;

namespace Adwais.Api.Extensions;

public static class AuthenticationExtensions
{
    public static IServiceCollection AddAppAuthentication(this IServiceCollection services, IConfiguration configuration)
    {
        // Configure Authentication Schemes
        var authBuilder = services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme);
        authBuilder.AddMicrosoftIdentityWebApi(configuration, "AzureAd");
        authBuilder.AddJwtBearer("KioskJwt", options =>
        {
            options.MapInboundClaims = false;
            var secret = configuration["Authentication:KioskJwtSecret"];
            var key = Encoding.UTF8.GetBytes(string.IsNullOrEmpty(secret) ? "SuperSecretKeyForTestingKioskTokens32CharsMinimum!" : secret);

            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidIssuer = "ADWAIS",
                ValidateAudience = true,
                ValidAudience = "ADWAIS-Kiosk",
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(key),
                ValidateLifetime = true,
                ClockSkew = TimeSpan.Zero,
                NameClaimType = "name",
                RoleClaimType = "role"
            };
        });

        // Register Claims Transformation for Entra ID users mapping
        services.AddTransient<IClaimsTransformation, LocalUserClaimsTransformation>();

        // Configure Authorization Policies
        services.AddAuthorization(options =>
        {
            options.AddPolicy("AdminOnly", policy =>
            {
                policy.AuthenticationSchemes.Add(JwtBearerDefaults.AuthenticationScheme);
                policy.AuthenticationSchemes.Add("KioskJwt");
                policy.RequireRole("Admin");
            });

            options.AddPolicy("StaffAccess", policy =>
            {
                policy.AuthenticationSchemes.Add(JwtBearerDefaults.AuthenticationScheme);
                policy.AuthenticationSchemes.Add("KioskJwt");
                policy.RequireRole("Admin", "Employee");
            });

            options.AddPolicy("KioskOrStaffAccess", policy =>
            {
                policy.AuthenticationSchemes.Add(JwtBearerDefaults.AuthenticationScheme);
                policy.AuthenticationSchemes.Add("KioskJwt");
                policy.RequireRole("Admin", "Employee", "Viewer");
            });
        });

        return services;
    }
}
