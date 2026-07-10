using System.Net.Http.Headers;
using System.Text;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;

namespace Adwais.Api.Middleware;

public class DashboardBasicAuthMiddleware
{
    private readonly RequestDelegate _next;
    private readonly string? _username;
    private readonly string? _password;

    public DashboardBasicAuthMiddleware(RequestDelegate next, IConfiguration configuration)
    {
        _next = next;
        _username = configuration["DashboardAuth:Username"];
        _password = configuration["DashboardAuth:Password"];
    }

    public async Task InvokeAsync(HttpContext context)
    {
        if (context.Request.Path.StartsWithSegments("/swagger") || 
            context.Request.Path.StartsWithSegments("/hangfire"))
        {
            if (string.IsNullOrEmpty(_username) || string.IsNullOrEmpty(_password))
            {
                throw new InvalidOperationException("DashboardAuth:Username and Password must be configured to access system dashboards.");
            }

            if (!context.Request.Headers.ContainsKey("Authorization"))
            {
                ReturnUnauthorized(context);
                return;
            }

            try
            {
                var authHeaderStr = context.Request.Headers.Authorization.ToString();
                if (!AuthenticationHeaderValue.TryParse(authHeaderStr, out var authHeader) || 
                    string.IsNullOrEmpty(authHeader.Parameter))
                {
                    ReturnUnauthorized(context);
                    return;
                }

                var credentialBytes = Convert.FromBase64String(authHeader.Parameter);
                var credentials = Encoding.UTF8.GetString(credentialBytes).Split(':', 2);
                
                if (credentials.Length != 2)
                {
                    ReturnUnauthorized(context);
                    return;
                }

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
