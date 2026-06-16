using System.Net.Http.Headers;
using System.Text;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;

namespace Adwais.Api.Middleware;

public class DashboardBasicAuthMiddleware
{
    private readonly RequestDelegate _next;
    private readonly string _username;
    private readonly string _password;

    public DashboardBasicAuthMiddleware(RequestDelegate next, IConfiguration configuration)
    {
        _next = next;
        _username = configuration["DashboardAuth:Username"] ?? "admin";
        _password = configuration["DashboardAuth:Password"] ?? "admin";
    }

    public async Task InvokeAsync(HttpContext context)
    {
        if (context.Request.Path.StartsWithSegments("/swagger") || 
            context.Request.Path.StartsWithSegments("/hangfire"))
        {
            if (!context.Request.Headers.ContainsKey("Authorization"))
            {
                ReturnUnauthorized(context);
                return;
            }

            try
            {
                var authHeader = AuthenticationHeaderValue.Parse(context.Request.Headers["Authorization"]);
                var credentialBytes = Convert.FromBase64String(authHeader.Parameter ?? string.Empty);
                var credentials = Encoding.UTF8.GetString(credentialBytes).Split(':', 2);
                
                var username = credentials[0];
                var password = credentials[1];

                if (username != _username || password != _password)
                {
                    ReturnUnauthorized(context);
                    return;
                }
            }
            catch
            {
                ReturnUnauthorized(context);
                return;
            }
        }

        await _next(context);
    }

    private static void ReturnUnauthorized(HttpContext context)
    {
        context.Response.Headers["WWW-Authenticate"] = "Basic realm=\"ADWAIS Dashboards\"";
        context.Response.StatusCode = StatusCodes.Status401Unauthorized;
    }
}
