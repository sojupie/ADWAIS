# Auth Integration Handoff: Frontend Implementation Plan

The backend implementation for Hybrid Authentication (Microsoft Entra ID + Custom Kiosk JWT) and Role-Based Access Control (RBAC) mapping is complete, manually tested, and fully verified. 

This document serves as the handoff plan for the next agent to complete the **React Frontend Integration** (Task 5).

---

## 1. Authentication Status Task List

- [x] **1. Database Schema & Migration** (Completed)
- [x] **2. Kiosk Authentication Backend API** (Completed)
- [x] **3. Authentication & Claims Middleware** (Completed)
- [x] **4. Authorization Policies & Controller Security** (Completed)
- [ ] **5. React Frontend Integration** (PENDING - FOR NEXT AGENT)
  - [ ] Implement Kiosk Device ID management (`localStorage` + cookie backup) on the kiosk landing view
  - [ ] Create Kiosk activation/registration landing view showing the activation code and polling the backend
  - [ ] Add the Kiosk Activation settings UI for authenticated staff members to input and approve codes
- [x] **6. Verification & End-to-End Testing** (Completed for Backend)

---

## 2. Backend API Reference for Kiosk Auth

The local Web API backend is available at: `http://localhost:5002` (or configured local port).

### A. Register Kiosk Device
* **Route**: `POST /api/kiosk/register`
* **Anonymous Access**: Yes
* **Payload**:
  ```json
  {
    "deviceId": "kiosk-display-99"
  }
  ```
* **Response (200 OK)**:
  ```json
  {
    "activationCode": "R944R7"
  }
  ```

### B. Activate/Authorize Kiosk (Staff/Admin Only)
* **Route**: `POST /api/kiosk/activate`
* **Authentication**: Requires EntraID JWT with `Admin` or `Employee` role claim in the `Authorization` header.
* **Payload**:
  ```json
  {
    "activationCode": "R944R7"
  }
  ```
* **Response**: `200 OK` (or `400 Bad Request` if the code has expired/is invalid).

### C. Get Kiosk JWT Token
* **Route**: `GET /api/kiosk/token?deviceId=kiosk-display-99`
* **Anonymous Access**: Yes (polls status)
* **Response (200 OK - Authorized)**:
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresInDays": 30
  }
  ```
* **Response (401 Unauthorized - Pending/Not Registered)**:
  ```json
  "Kiosk device is not authorized."
  ```

---

## 3. Frontend Implementation Steps (React)

The next agent must implement the following views and components in the frontend project:

### Step 1: Device ID Management
* Detect if the client is running in a Kiosk context or on a kiosk path (e.g., `/kiosk`).
* Look up `deviceId` in browser `localStorage`. If missing:
  1. Generate a persistent unique identifier (e.g., `kiosk-device-{UUID}`).
  2. Save it in `localStorage` and write a long-lived cookie backup.

### Step 2: Kiosk Registration & Polling View
* Create a dedicated Kiosk dashboard landing/entry view (e.g., at `/kiosk`).
* If no local Kiosk token is saved or it is expired:
  1. Call `POST /api/kiosk/register` sending the generated `deviceId`.
  2. Display the returned 6-character case-insensitive `activationCode` on the screen in a large, readable format.
  3. Start a polling routine (e.g., every 5 seconds) invoking `GET /api/kiosk/token?deviceId={deviceId}`.
  4. Once the endpoint returns `200 OK` with the token:
     * Save the token locally.
     * Redirect to the clean kiosk dashboard path.

### Step 3: Staff Activation UI
* Add a settings view/panel for authenticated staff members (e.g., `/admin/kiosks` or `/settings/kiosks`).
* Provide a simple input form where an employee or administrator can input the 6-character activation code displayed on the kiosk.
* Submit the code to `POST /api/kiosk/activate` with the logged-in staff member's credentials.
* Show a success toast or message on successful activation.
