# Authentication

ADWAIS uses OpenID Connect (OIDC) for browser users and a signed JWT for kiosk displays. The backend validates both with ASP.NET Core authentication schemes. It has no MSAL or Microsoft Graph dependency.

## Browser sign-in

The web app uses `oidc-client-ts` and `react-oidc-context`. API requests carry the access token as a bearer token. The backend resolves the user by the `sub` claim and updates the local user record through `ExternalSubjectId`.

Frontend settings: `VITE_OIDC_AUTHORITY` and `VITE_OIDC_CLIENT_ID` are required. `VITE_OIDC_SCOPE` defaults to `openid profile email`.

## Demo access

| Route | Auth | Behavior |
| --- | --- | --- |
| `GET /api/demo/token` | Anonymous | Returns a Viewer kiosk token when `Authentication:EnableDemoAccess=true`. Returns `404` otherwise. |

Demo tokens are read-only. They pass `KioskOrStaffAccess`. Write operations require `StaffAccess` or `AdminOnly` and return `403`.

## Kiosk access

| Route | Auth | Behavior |
| --- | --- | --- |
| `POST /api/kiosk/register` | Anonymous | Registers a display. Returns a temporary activation code. |
| `POST /api/kiosk/activate` | `StaffAccess` | Authorizes a display with its activation code. |
| `GET /api/kiosk/token?deviceId=...` | Kiosk flow | Returns the display's 30-day kiosk JWT. |
| `POST /api/kiosk/swagger-admin-token` | Anonymous, Development only | Returns a development Admin kiosk token when the secret matches. |

Kiosk tokens use the configured kiosk issuer and carry their own role claims. They do not use database user provisioning.

## Current user

| Route | Auth | Behavior |
| --- | --- | --- |
| `GET /api/users/me` | `KioskOrStaffAccess` | Returns the local OIDC user for `sub`, or a transient kiosk user. |

## Hangfire dashboard

| Route | Auth | Behavior |
| --- | --- | --- |
| `POST /api/dashboard-session` | `AdminOnly` bearer token | Creates a five-minute HttpOnly `adwais_dashboard` cookie for Hangfire. |
| `DELETE /api/dashboard-session` | Anonymous | Clears the dashboard cookie. Call during sign-out. |
| `GET /hangfire` | Dashboard cookie + Admin role | Opens the Hangfire UI. |

The dashboard session endpoint bridges SPA bearer auth and the server-rendered Hangfire UI. Browser navigation does not carry the `Authorization` header, so Hangfire needs a short-lived cookie to populate `HttpContext.User`. The cookie is `Secure` outside development and follows the request scheme in development.

## Authorization policies

| Policy | Roles | Use |
| --- | --- | --- |
| `KioskOrStaffAccess` | `Admin`, `Employee`, `Viewer` | Read-only dashboard and kiosk data. |
| `StaffAccess` | `Admin`, `Employee` | Staff operations such as kiosk activation. |
| `AdminOnly` | `Admin` | Admin mutations, dashboard access, job controls. |
