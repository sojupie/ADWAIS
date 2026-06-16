using Hangfire.Dashboard;

namespace Adwais.Api.Filters;

public class AllowAllDashboardAuthorizationFilter : IDashboardAuthorizationFilter
{
    public bool Authorize(DashboardContext context)
    {
        // Security is delegated to the DashboardBasicAuthMiddleware
        return true;
    }
}
