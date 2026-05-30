# Implementation Plan: Hybrid Authentication (EntraID + Kiosk Mode)

## Overview
Enable enterprise-grade authentication via Microsoft EntraID while supporting a high-availability "Kiosk Mode" for dashboard displays using URL-based API keys. Authorization remains local, mapping external identities to internal roles (Admin, Viewer, Employee).

## 1. Prerequisites
- [x] Install `Microsoft.Identity.Web`
- [x] Install `Microsoft.AspNetCore.Authentication.JwtBearer`
- [x] Setup Azure AD App Registration (ClientID, TenantID)

## 2. Authentication Schemes

### Scheme A: `EntraID` (Standard)
- **Method:** JWT Bearer tokens from Microsoft Identity.
- **Identity:** Maps `preferred_username` or `oid` to the local `User` table.
- **Roles:** Hydrated via `IClaimsTransformation`.

### Scheme B: `KioskKey` (Custom)
- **Method:** Custom `AuthenticationHandler`.
- **Trigger:** Presence of `?kioskKey=` in query string or `X-Kiosk-Key` header.
- **Validation:** Validated against `GlobalConfig.KioskApiKey`.
- **Identity:** Fixed "KioskMode" identity with `Viewer` role.

## 3. Authorization Policies
Define three standard policies in `Program.cs`:
1. **`AdminOnly`**: Requires `UserRole.Admin`.
2. **`StaffAccess`**: Requires `UserRole.Admin` OR `UserRole.Employee`.
3. **`PublicView`**: Allows any authenticated user (including Kiosk).

## 4. Implementation Steps
1. **Configure Middleware**: Add `.AddMicrosoftIdentityWebApi(...)` and `.AddScheme<KioskOptions, KioskHandler>(...)`.
2. **Claims Transformation**: Create `LocalUserClaimsTransformation` to inject local database roles into the principal.
3. **Controller Security**: Apply `[Authorize]` attributes and policies to all controllers.
4. **Audit Logging**: Ensure `GlobalExceptionHandler` captures any `UnauthorizedAccessException`.

## 5. Security Notes
- Kiosk keys should be long-lived but revocable via the `GlobalConfig` API.
- All write operations (POST/PATCH/DELETE) must require the `AdminOnly` policy.
