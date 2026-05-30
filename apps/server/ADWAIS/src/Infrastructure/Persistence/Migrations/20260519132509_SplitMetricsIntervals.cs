using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Adwais.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class SplitMetricsIntervals : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "metrics_fetch_interval_minutes",
                table: "global_config");

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "last_latency_update",
                table: "monitor",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "last_uptime_update",
                table: "monitor",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "latency_fetch_interval_minutes",
                table: "global_config",
                type: "integer",
                nullable: false,
                defaultValue: 10);

            migrationBuilder.AddColumn<int>(
                name: "uptime_fetch_interval_minutes",
                table: "global_config",
                type: "integer",
                nullable: false,
                defaultValue: 60);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "last_latency_update",
                table: "monitor");

            migrationBuilder.DropColumn(
                name: "last_uptime_update",
                table: "monitor");

            migrationBuilder.DropColumn(
                name: "latency_fetch_interval_minutes",
                table: "global_config");

            migrationBuilder.DropColumn(
                name: "uptime_fetch_interval_minutes",
                table: "global_config");

            migrationBuilder.AddColumn<int>(
                name: "metrics_fetch_interval_minutes",
                table: "global_config",
                type: "integer",
                nullable: false,
                defaultValue: 15);
        }
    }
}


