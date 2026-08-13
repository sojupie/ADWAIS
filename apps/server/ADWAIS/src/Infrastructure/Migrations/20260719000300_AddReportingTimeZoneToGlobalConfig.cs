// Part of the ADWAIS project, under the Business Source License 1.1.
// See /LICENSE for license information.
// SPDX-License-Identifier: BUSL-1.1

using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Adwais.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddReportingTimeZoneToGlobalConfig : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "reporting_time_zone_id",
                table: "global_config",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "Europe/Stockholm");

            migrationBuilder.UpdateData(
                table: "global_config",
                keyColumn: "id",
                keyValue: 1,
                column: "reporting_time_zone_id",
                value: "Europe/Stockholm");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "reporting_time_zone_id",
                table: "global_config");
        }
    }
}
