using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Adwais.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class HistoricalUptimeTracking : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(SqlDefinitions.DropAllViews);

            migrationBuilder.DropColumn(
                name: "current_uptime_percentage",
                table: "monitor");

            migrationBuilder.AlterColumn<decimal>(
                name: "total_value_inc_vat",
                table: "orders",
                type: "numeric",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AlterColumn<decimal>(
                name: "total_value_exc_vat",
                table: "orders",
                type: "numeric",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.CreateTable(
                name: "monitor_availability",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "uuid_generate_v4()"),
                    monitor_id = table.Column<int>(type: "integer", nullable: false),
                    date = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    uptime_percentage = table.Column<double>(type: "double precision", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_monitor_availability", x => x.id);
                    table.ForeignKey(
                        name: "fk_monitor_availability_monitors_monitor_id",
                        column: x => x.monitor_id,
                        principalTable: "monitor",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_monitor_availability_monitor_id_date",
                table: "monitor_availability",
                columns: new[] { "monitor_id", "date" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(SqlDefinitions.DropAllViews);

            migrationBuilder.DropTable(
                name: "monitor_availability");

            migrationBuilder.AlterColumn<int>(
                name: "total_value_inc_vat",
                table: "orders",
                type: "integer",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric");

            migrationBuilder.AlterColumn<int>(
                name: "total_value_exc_vat",
                table: "orders",
                type: "integer",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric");

            migrationBuilder.AddColumn<double>(
                name: "current_uptime_percentage",
                table: "monitor",
                type: "double precision",
                nullable: false,
                defaultValue: 0.0);
        }
    }
}


