# Server Runner Environment

This directory manages the local development runtime environment for the backend database container.

## Local Services

### 1. PostgreSQL Database
The backend API requires a running PostgreSQL database. A local development container is configured via the [`docker-compose.yml`](file:///c:/Users/ollem/Git/motillo%20project/dashboard/apps/server/development-db/docker-compose.yml) file.

*   **Database Engine**: PostgreSQL 15 (Alpine)
*   **Default Connection Details** (defined in Compose):
    *   **Host**: `localhost:5432`
    *   **Username**: `postgres`
    *   **Password**: `development_password`
    *   **Database**: `analyticsdb`

---

## Operating Commands

Ensure Docker is running before executing these commands:

*   **Spin up services (detached mode)**:
    ```bash
    pnpm db:up
    ```
    *(Run from repository root, or run `docker compose up -d` in this directory)*

*   **Stop services and preserve data**:
    ```bash
    docker compose down
    ```

*   **Destroy services and volume data**:
    ```bash
    docker compose down -v
    ```

---

## Database Initialization Notes

*   A volume called `postgres_data` is created automatically to persist data.

