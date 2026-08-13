// Part of the ADWAIS project, under the Business Source License 1.1.
// See /LICENSE for license information.
// SPDX-License-Identifier: BUSL-1.1

using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Adwais.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class EditSystemEventsRetention : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "global_config",
                keyColumn: "id",
                keyValue: 1,
                column: "system_event_retention_days",
                value: 2);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "global_config",
                keyColumn: "id",
                keyValue: 1,
                column: "system_event_retention_days",
                value: 30);
        }
    }
}
