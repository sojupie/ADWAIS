using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Adwais.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class UpdateMonitorDeleteBehavior : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_monitor_tenant_tenant_id",
                table: "monitor");

            migrationBuilder.AddForeignKey(
                name: "fk_monitor_tenant_tenant_id",
                table: "monitor",
                column: "tenant_id",
                principalTable: "tenant",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_monitor_tenant_tenant_id",
                table: "monitor");

            migrationBuilder.AddForeignKey(
                name: "fk_monitor_tenant_tenant_id",
                table: "monitor",
                column: "tenant_id",
                principalTable: "tenant",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}


