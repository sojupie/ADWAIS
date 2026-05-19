using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class GlobalConfigMetricsInterval : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "uptime_robot_rate_limit",
                table: "global_config");

            migrationBuilder.AlterColumn<bool>(
                name: "uptime_robot_fetch_enabled",
                table: "global_config",
                type: "boolean",
                nullable: false,
                defaultValue: true,
                oldClrType: typeof(bool),
                oldType: "boolean");

            migrationBuilder.AlterColumn<bool>(
                name: "litium_fetch_enabled",
                table: "global_config",
                type: "boolean",
                nullable: false,
                defaultValue: true,
                oldClrType: typeof(bool),
                oldType: "boolean");

            migrationBuilder.AddColumn<int>(
                name: "metrics_fetch_interval_minutes",
                table: "global_config",
                type: "integer",
                nullable: false,
                defaultValue: 15);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "metrics_fetch_interval_minutes",
                table: "global_config");

            migrationBuilder.AlterColumn<bool>(
                name: "uptime_robot_fetch_enabled",
                table: "global_config",
                type: "boolean",
                nullable: false,
                oldClrType: typeof(bool),
                oldType: "boolean",
                oldDefaultValue: true);

            migrationBuilder.AlterColumn<bool>(
                name: "litium_fetch_enabled",
                table: "global_config",
                type: "boolean",
                nullable: false,
                oldClrType: typeof(bool),
                oldType: "boolean",
                oldDefaultValue: true);

            migrationBuilder.AddColumn<int>(
                name: "uptime_robot_rate_limit",
                table: "global_config",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }
    }
}
