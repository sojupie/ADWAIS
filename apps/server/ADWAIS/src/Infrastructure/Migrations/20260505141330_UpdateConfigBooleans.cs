using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Adwais.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class UpdateConfigBooleans : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "enabled",
                table: "global_config",
                newName: "uptime_robot_fetch_enabled");

            migrationBuilder.AddColumn<bool>(
                name: "litium_fetch_enabled",
                table: "global_config",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "litium_fetch_enabled",
                table: "global_config");

            migrationBuilder.RenameColumn(
                name: "uptime_robot_fetch_enabled",
                table: "global_config",
                newName: "enabled");
        }
    }
}


