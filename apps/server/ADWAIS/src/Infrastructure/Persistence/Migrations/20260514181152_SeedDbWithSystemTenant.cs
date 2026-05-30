using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Adwais.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class SeedDbWithSystemTenant : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "tenant",
                columns: new[] { "id", "fetched_from", "fetched_until", "last_polled", "litium_base_url", "name", "order_fetching_enabled", "service_account_token" },
                values: new object[] { new Guid("00000000-0000-0000-0000-000000000001"), null, null, null, "N/A", "System (unassigned monitors)", false, "N/A" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "tenant",
                keyColumn: "id",
                keyValue: new Guid("00000000-0000-0000-0000-000000000001"));
        }
    }
}


