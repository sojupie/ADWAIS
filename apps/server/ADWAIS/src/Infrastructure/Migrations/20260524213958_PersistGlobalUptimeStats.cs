using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Adwais.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class PersistGlobalUptimeStats : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "active_subscription",
                table: "global_config",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "monitors_count",
                table: "global_config",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "monitors_limit",
                table: "global_config",
                type: "integer",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "active_subscription",
                table: "global_config");

            migrationBuilder.DropColumn(
                name: "monitors_count",
                table: "global_config");

            migrationBuilder.DropColumn(
                name: "monitors_limit",
                table: "global_config");
        }
    }
}


