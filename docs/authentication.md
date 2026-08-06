# Authentication and protected routes

ADWAIS uses standard OpenID Connect (OIDC) for browser users and a separate, signed kiosk JWT
for registered displays. The backend validates both through ASP.NET Core authentication schemes;
there is no vendor-specific MSAL or Microsoft Graph dependency.

## Browser sign-in

The web app uses `oidc-client-ts` and `react-oidc-context`. The access token is sent as a bearer
token on API requests. The backend resolves an OIDC user by the standard `sub` claim and provisions
or updates the local user record through `ExternalSubjectId`.

Required frontend settings are `VITE_OIDC_AUTHORITY` and `VITE_OIDC_CLIENT_ID`. The optional
`VITE_OIDC_SCOPE` defaults to `openid profile email`.

## Demo access

| Route | Auth | Behavior |
| --- | --- | --- |
| `GET /api/demo/token` | Anonymous | Returns a Viewer kiosk token when `Authentication:EnableDemoAccess=true`; otherwise returns `404`. |

Demo tokens are read-only. They can use endpoints protected by `KioskOrStaffAccess`, but write
operations require `StaffAccess` or `AdminOnly` and return `403`.

## Kiosk access

| Route | Auth | Behavior |
| --- | --- | --- |
| `POST /api/kiosk/register` | Anonymous | Registers a display and returns a temporary activation code. |
| `POST /api/kiosk/activate` | `StaffAccess` | Authorizes a display using its activation code. |
| `GET /api/kiosk/token?deviceId=...` | Kiosk/device flow | Returns the registered display's 30-day kiosk JWT. |
| `POST /api/kiosk/swagger-admin-token` | Anonymous, Development only | Returns a development Admin kiosk token when the configured secret matches. |

Kiosk tokens are identified by the configured kiosk issuer and carry their own role claims. They
do not go through database user provisioning.

## Current user

| Route | Auth | Behavior |
| --- | --- | --- |
| `GET /api/users/me` | `KioskOrStaffAccess` | Returns the local OIDC user resolved from `sub`, or a transient kiosk user representation. |

## Hangfire dashboard

| Route | Auth | Behavior |
| --- | --- | --- |
| `POST /api/dashboard-session` | `AdminOnly` bearer token | Creates a five-minute, HttpOnly `adwais_dashboard` cookie for Hangfire navigation. |
| `DELETE /api/dashboard-session` | Anonymous | Clears the dashboard cookie. Safe to call during sign-out. |
| `GET /hangfire` | Dashboard cookie + Admin role | Opens the server-rendered Hangfire UI. |

The dashboard session endpoint is a deliberate bridge between SPA bearer authentication and the
server-rendered Hangfire UI. Normal browser navigations do not include the SPA's `Authorization`
header, so Hangfire needs a short-lived cookie to populate `HttpContext.User`. The cookie is
`Secure` in non-development environments and follows the request scheme during local development
so plain HTTP testing is possible.

## Authorization policies

| Policy | Roles | Intended use |
| --- | --- | --- |
| `KioskOrStaffAccess` | `Admin`, `Employee`, `Viewer` | Read-only dashboard and kiosk-safe data access. |
| `StaffAccess` | `Admin`, `Employee` | Staff operations such as kiosk activation and controlled writes. |
| `AdminOnly` | `Admin` | Administrative mutations, dashboard access, and job controls. |
