using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Adwais.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddLastSyncErrorToTenantAndMonitor : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "last_sync_error",
                table: "tenant",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "last_sync_error",
                table: "monitor",
                type: "text",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "tenant",
                keyColumn: "id",
                keyValue: new Guid("00000000-0000-0000-0000-000000000001"),
                column: "last_sync_error",
                value: null);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "last_sync_error",
                table: "tenant");

            migrationBuilder.DropColumn(
                name: "last_sync_error",
                table: "monitor");
        }
    }
}


